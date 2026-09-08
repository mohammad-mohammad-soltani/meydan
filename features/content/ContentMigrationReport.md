# Content Migration Report

## Legacy view analysis

\`ViewContent.tsx\` is a presentational content hub composed of:

- One highlighted content card.
- Four operational shortcuts: speakers, contact, print, and safety.
- A horizontally-scrollable nightly gathering schedule.
- Two written speech-sheet entries.
- One audio chant entry with details and play interaction.

It has no local React state. Every interaction is encoded as a \`data-action\` string and resolved by the global \`MeydanApp\` event parser.

## Legacy dependencies

| Legacy behavior | Former dependency | New replacement |
| --- | --- | --- |
| Open detail/audio modal | \`MeydanApp\` selector-based modal methods | \`MediaPreview\` with React state |
| Navigate to speakers | \`switchView\` and manual history | Next \`Link href="/speakers"\` |
| Navigate to podcasts | \`switchView\` | Content preview for now; Podcasts route remains legacy |
| Audio interaction | \`playAudio\` alert | React playback-preview state |
| Content fixtures | Inline JSX literals | \`content.service.ts\` |

## New boundaries

- Domain types: \`types.ts\`
- Mock/API boundary: \`services/content.service.ts\`
- Category, filter, preview, and player state: \`hooks/useContent.ts\`
- Presentation: components under \`components/\`
- Route composition: \`app/(app)/content/page.tsx\`

## Shared-component review

Feed's tab and card patterns were reviewed. They are intentionally not imported because Content has different domain states and accessibility labels. Both features use the shared Tailwind/design-token vocabulary, direct Lucide imports, and React callbacks.

## Remaining debt

- Content fixture data must be replaced with typed server/API data.
- The audio preview is UI state only; it needs a real media source and playback service.
- The podcasts destination remains legacy until the Podcasts migration.
- \`ViewContent.tsx\` remains in the legacy controller until \`MeydanApp\` can be retired.