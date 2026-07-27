@AGENTS.md

# Project Notes

- Write project notes in English.
- Never create a local commit without an explicit request in the current message.
- A reusable inline SVG must become its own component.
- Integration fetch/mapping belongs in a small adapter/helper, not in UI/page.
- Components use `export const`, not `export function`. Next route files keep `export default`.
- Types belong in a `types.ts` next to the module, not inline.
- URLs and magic values belong in a `constants.ts`, not inline.
