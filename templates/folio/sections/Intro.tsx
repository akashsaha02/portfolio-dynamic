import type { Profile } from "@/lib/content-types";
import { RevealLines } from "../motion/RevealLines";
import { Magnetic } from "../ui/Magnetic";
import { RoundButton } from "../ui/RoundButton";

// Intro (guide §4.2 row 2): the two-sentence statement (`profile.intro`) revealed line by line,
// the longer `profile.about` as the small paragraph, and the round "About me" button. Phone:
// stacked, button bottom-right; md puts the paragraph and the button side by side under the
// statement. lg: 8/4 columns, the paragraph and the button on the right;
// the button drifts a little against the scroll where CSS scroll timelines exist (.f-parallax).

type IntroProps = {
  profile: Pick<Profile, "intro" | "about">;
};

export function Intro({ profile }: IntroProps) {
  return (
    <section aria-labelledby="intro-title" className="f-bleed py-section">
      <h2 id="intro-title" className="sr-only">
        Introduction
      </h2>
      <div className="grid gap-8 md:gap-10 lg:grid-cols-12 lg:gap-x-12">
        <RevealLines text={profile.intro} className="type-heading max-w-[24ch] lg:col-span-8 lg:max-w-none" />
        <div className="grid gap-10 md:grid-cols-[minmax(0,46ch)_1fr] md:items-start lg:col-span-4 lg:grid-cols-1 lg:content-start lg:gap-14 lg:pt-3">
          <p className="max-w-[46ch] text-base leading-relaxed text-pretty text-(--fg-muted)">{profile.about}</p>
          <div className="f-parallax flex justify-end lg:justify-start">
            <Magnetic>
              <RoundButton href="/about">About me</RoundButton>
            </Magnetic>
          </div>
        </div>
      </div>
    </section>
  );
}
