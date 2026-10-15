/**
 * Shown above the Projects list only (`admin.components.beforeList`), not on the edit form where
 * nothing can be dragged (QA F-11).
 */
export function ProjectsListHint() {
  return (
    <p className="ak-list-hint">
      Drag rows to reorder (while the list isn’t sorted by a column); the site uses this order. Changes stay drafts
      until you press Publish.
    </p>
  );
}
