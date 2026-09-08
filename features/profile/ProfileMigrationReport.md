# Profile Migration Report

## Legacy view analysis

\`ViewCombinedProfile.tsx\` combines two distinct profile surfaces:

- A verified square profile with stats, follow/chat/management actions, an evening schedule, and a recorded activity.
- A personal resume profile with identity data, statistics, and two accordion sections.
- Cross-feature entry points to direct chat and full posts.

Legacy state is entirely delegated to \`MeydanApp\`: selected tab is persisted in \`localStorage\`, accordions use selector toggling, and follow/activity actions mutate DOM classes or text.

## New boundaries

| Responsibility | New owner |
| --- | --- |
| Profile models | \`types.ts\` |
| Mock/API boundary | \`services/profile.service.ts\` |
| Tabs, accordions, follow/actions state | \`hooks/useProfile.ts\` |
| Identity chrome | \`ProfileHeader.tsx\` |
| Details, stats, schedule, resume accordions | \`ProfileInfo.tsx\` |
| Tab UI | \`ProfileTabs.tsx\` |
| Recorded activity | \`ProfileActivity.tsx\` |
| Follow, chat, management actions | \`ProfileActions.tsx\` |
| Composition and temporary management dialog | \`ProfileView.tsx\` |

## Dependencies and navigation

- Chat action uses \`Link href="/chat/tehran-enghelab"\`.
- Activity links use \`Link href="/posts/moakab-report"\`.
- Those routes remain legacy-backed until their own migrations; Profile does not migrate their implementation.
- The new Profile code has no \`data-action\`, legacy event parser, DOM selector, \`innerHTML\`, \`insertAdjacentHTML\`, or \`history.pushState\`.

## Shared-component review

Existing Feed cards/actions, Content tabs, and Speakers dialog patterns were reviewed. They are domain-specific and currently lack a common prop contract. Profile follows the same design tokens and direct Lucide imports without duplicating business logic. A generic Dialog and Avatar belong to the later shared-component extraction phase.

## Remaining debt

- Profile data and activity are fixtures; replace with authenticated profile APIs.
- Follow and management actions are local state only.
- Tab/accordion state has intentionally not been persisted; add a versioned preference hook only if product behavior requires it.
- \`ViewCombinedProfile.tsx\` remains until the legacy controller is retired.