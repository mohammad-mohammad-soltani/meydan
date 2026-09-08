# Chat migration report

## Legacy analysis

The legacy chat was split between `ViewChat.tsx`, `ViewDirectChat.tsx`, and the delegated controller in `MeydanApp`.

- `ViewChat` rendered conversation and notification markup.
- `ViewDirectChat` rendered a fixed two-message conversation and media menu shell.
- `MeydanApp` switched list tabs, opened the direct view, changed the visible view with legacy routing, toggled media UI and appended outgoing messages through `insertAdjacentHTML`.
- There was no real conversation repository, unread-state store, durable message persistence, API, or realtime connection. The sent message disappeared on refresh.

## New ownership

| Concern | Owner |
| --- | --- |
| Domain models | `types.ts` |
| Mock conversation/message/notification boundary | `services/chat.service.ts` |
| List, notifications and active tab | `hooks/useChat.ts` |
| Conversation, input and optimistic send state | `hooks/useConversation.ts` |
| List UI | `ChatView`, `ConversationList`, `ConversationItem` |
| Conversation UI | `ConversationView`, `ChatHeader`, `MessageList`, `MessageBubble`, `MessageInput` |

## Compatibility and routing

`/chat` owns the conversation list and notification tab. `/chat/[conversationId]` owns the conversation screen and reads the URL parameter directly, so refresh and browser navigation no longer depend on a hidden view in MeydanApp. List/notification navigation uses `next/link`.

## Removed from migrated Chat

No new Chat file uses `data-action`, delegated events, `querySelector`, `innerHTML`, `insertAdjacentHTML`, `history.pushState` or localStorage. New messages use React state and an optimistic replacement when the service resolves.

## Realtime preparation and remaining debt

- The service is the future HTTP/WebSocket boundary; UI and hooks do not know transport details.
- Current data is intentionally mock-only. No API route or WebSocket is introduced.
- Messages and unread counts remain in memory, matching the legacy non-persistent behaviour. Durable storage, read receipts, attachments, pagination, retry and realtime subscriptions are future work.
- MeydanApp still mounts old chat views for the remaining legacy feature controller, but neither Chat route uses it.
