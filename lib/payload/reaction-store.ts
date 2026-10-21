// Mongo-backed 👏 totals (collections/ReactionCounts.ts). Server only: used by the reactions route.
//
// Increments go straight to the collection's MongoDB driver with `$inc` + upsert, so concurrent
// taps never lose a count (Payload's update would read-modify-write). The collection has no hooks,
// so nothing is skipped by bypassing Payload's operation layer.

import "server-only";
import type { Payload } from "payload";

const SLUG = "reaction-counts";

type CountDoc = { slug: string; count: number; createdAt: Date; updatedAt: Date };

type RawCollection = {
  findOne(filter: object, options?: object): Promise<Partial<CountDoc> | null>;
  findOneAndUpdate(filter: object, update: object, options: object): Promise<Partial<CountDoc> | null>;
};

function collection(payload: Payload): RawCollection {
  const model = payload.db.collections?.[SLUG] as { collection: RawCollection } | undefined;
  if (!model) throw new Error(`[reactions] the ${SLUG} collection is not registered`);
  return model.collection;
}

/** Current total for a case study; 0 when nobody has reacted yet. */
export async function readReactionCount(payload: Payload, slug: string): Promise<number> {
  const doc = await collection(payload).findOne({ slug }, { projection: { count: 1 } });
  return typeof doc?.count === "number" ? doc.count : 0;
}

/** Adds `by` claps atomically and returns the new total. */
export async function incrementReactionCount(payload: Payload, slug: string, by: number): Promise<number> {
  const now = new Date();
  const run = () =>
    collection(payload).findOneAndUpdate(
      { slug },
      { $inc: { count: by }, $set: { updatedAt: now }, $setOnInsert: { slug, createdAt: now } },
      { upsert: true, returnDocument: "after", projection: { count: 1 } },
    );
  let doc: Partial<CountDoc> | null;
  try {
    doc = await run();
  } catch (error) {
    // Two first-ever taps on the same slug can race on the unique index (E11000); the loser's
    // retry finds the document the winner created and increments it.
    if ((error as { code?: number })?.code !== 11000) throw error;
    doc = await run();
  }
  return typeof doc?.count === "number" ? doc.count : by;
}
