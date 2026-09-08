# Navigation Migration Report

## Current status

The shared shell navigation has migrated to Next.js routing:

- `components/layouts/BottomNavigation.tsx` uses `next/link` and `usePathname`.
- `components/layouts/AppShell.tsx` uses `next/link` for desktop navigation.
- Root and compatibility URLs use server-side `redirect()`.

## Remaining manual navigation

| Location | Owner | Current mechanism | Phase 4 replacement |
| --- | --- | --- | --- |
| `components/prototype/meydan-app.tsx :: show` | Legacy route controller | `window.history.pushState` plus hidden view classes | Remove with feature migrations; each route will render only its feature. |
| `components/prototype/meydan-app.tsx :: handlePopState` | Legacy route controller | `window.addEventListener('popstate')` | Remove when legacy controller is retired. |
| `components/prototype/views/ViewFeed.tsx` | Feed | `data-action="switchView(...)"` | Replace with `Link` and Feed callbacks. |
| `components/prototype/views/ViewContent.tsx` | Content | `data-action="switchView(...)"` | Replace in Content migration. |
| `components/prototype/views/ViewChat.tsx` and `ViewDirectChat.tsx` | Chat | Controller-routed `data-action` | Replace with `Link`, `useRouter`, and `useChat`. |
| `components/prototype/views/ViewFullPost.tsx` and `ViewCombinedProfile.tsx` | Posts/Profile | `openFullPostPage` and `switchView` | Replace with typed post routes. |

## Dynamic route safety

- `/chat/[conversationId]` and `/posts/[postId]` are physical App Router routes and can be refreshed safely.
- Route parameters are not yet connected to a data source. Unknown IDs render the temporary legacy fallback.
- Selected legacy chat/post content remains controller state until those feature migrations.

## Rule for new code

No new component may add `history.pushState`, `popstate` listeners, `querySelector`, or `data-action` navigation. Use `Link`, `useRouter`, and `usePathname` instead.
