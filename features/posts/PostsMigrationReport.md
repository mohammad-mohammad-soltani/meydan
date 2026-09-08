# Posts Migration Report

## Legacy view analysis

\`ViewFullPost.tsx\` renders a post detail view with:

- Back navigation, outlet metadata, live-entry call to action, author, post body, and media placeholders.
- Like, repost, comment count, and share actions.
- Media-reflection cards.
- A comment list and comment form.

The legacy component relies on \`MeydanApp\` to inject the selected author, handle, content, outlet, and statistics into DOM IDs. Reactions, sharing, route changes, and comment submission also depend on \`data-action\` and selector/event-delegation behavior.

## Dynamic-route migration

\`app/(app)/posts/[postId]/page.tsx\` is now a real data-bound dynamic route:

1. Next resolves \`params.postId\`.
2. The server page calls \`getPostById(postId)\`.
3. Unknown IDs call \`notFound()\`.
4. The typed post object is passed to the interactive \`PostView\`.

The service is mock-only by product decision; it is the future API boundary.

## New boundaries

| Responsibility | New owner |
| --- | --- |
| Data models | \`types.ts\` |
| Dynamic post lookup | \`services/posts.service.ts\` |
| Reactions, comment state, live state | \`hooks/usePost.ts\` |
| Header and author metadata | \`PostHeader.tsx\` |
| Body and media | \`PostContent.tsx\` |
| Reactions/live call to action | \`PostActions.tsx\` |
| Comments | \`CommentsList.tsx\`, \`CommentInput.tsx\` |
| Composition | \`PostView.tsx\` |

## Links from migrated features

- Feed already links to \`/posts/meydan-enghelab\` and \`/posts/amir-chakhmaq\`.
- Profile already links to \`/posts/moakab-report\`.
- All three IDs are present in the typed mock service, so these links now resolve to real dynamic-route data.

## Shared-component review

Feed post actions were reviewed but are coupled to the feed card model. Posts owns its full-detail reactions and comments. Cross-feature types were not imported because Posts is becoming the canonical detailed-post boundary. Generic shared Avatar, Dialog, and action primitives remain future shared-component work.

## Remaining debt

- All data is intentionally typed mock data; replace only when a backend contract is ready.
- Sharing uses browser Web Share/Clipboard APIs.
- Comment and reaction changes are local, not persisted.
- \`ViewFullPost.tsx\` remains for the legacy controller until it is retired.