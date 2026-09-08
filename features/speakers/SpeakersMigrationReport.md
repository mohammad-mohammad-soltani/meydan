# Speakers Migration Report

## Legacy view analysis

\`ViewSpeakers.tsx\` provides a searchable speaker directory with:

- Header and return navigation to Content.
- Search input for name, topic, and city.
- A speaker list with profile metadata.
- Request-to-book actions.
- A request form for venue and schedule.
- A temporary booking confirmation.

The legacy view has no local React state. Search, selection, booking-panel visibility, manual navigation, and form action handling are delegated to \`MeydanApp\` through \`data-action\` and selector-based DOM mutation.

## New boundaries

| Responsibility | New owner |
| --- | --- |
| Speaker and booking models | \`types.ts\` |
| Mock/API boundary | \`services/speakers.service.ts\` |
| Search, filters, selection, booking state | \`hooks/useSpeakers.ts\` |
| Search UI | \`SpeakersSearch.tsx\` |
| Filter controls | \`SpeakersFilters.tsx\` |
| Speaker row | \`SpeakerCard.tsx\` |
| Request/detail dialog | \`SpeakerProfile.tsx\` |
| Feature composition | \`SpeakersView.tsx\` |

## Navigation and legacy replacement

- Content back navigation now uses \`Link href="/content"\`.
- The booking dialog uses React state and form callbacks.
- The new code has no \`data-action\`, event parser, \`querySelector\`, \`innerHTML\`, \`insertAdjacentHTML\`, or \`history.pushState\`.

## Shared-component review

Feed and Content card/modal patterns were reviewed. There is no shared component with a compatible speaker-reservation data model yet, so this feature uses its own typed presentation components. A generic accessible modal can be considered during the later shared-component phase.

## Remaining debt

- The speaker catalog is fixture data and should become API-backed.
- Reservation submission is local confirmation state; it needs authenticated server validation and a reservation service.
- \`ViewSpeakers.tsx\` remains for legacy-controller safety until \`MeydanApp\` is fully retired.