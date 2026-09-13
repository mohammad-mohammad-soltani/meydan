# Realtime Chat Implementation Plan

> **SUPERSEDED — do not implement this plan.** The Socket.IO service, socket
> tickets and client-emitted chat commands described below no longer exist.
> Meydan now runs a single Pusher-compatible Soketi transport
> (`wss://naghshman.ir/socket/app/{APP_KEY}`): REST commands to WordPress, live
> events from Soketi on the private channel `private-user-{id}`.
>
> Current architecture:
> - `lib/realtime/soketi.ts` — single public endpoint configuration
> - `lib/realtime/client.ts` — one shared pusher-js connection per session
> - `lib/realtime/user-channel.ts` — `private-user-{id}` subscriptions
> - `lib/realtime/config.ts` / `lib/realtime/auth.ts` — `GET /chat/realtime/config`, `POST /chat/realtime/auth`
> - `features/chat/*` — chat event handling; every mutation goes over REST
>
> Kept for history only.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mock chat with persistent authenticated Socket.IO chat across Meydan frontend and backend.

**Architecture:** WordPress owns authenticated REST/history and issues short-lived socket tickets. A Node Socket.IO service on the same Freestyle VM shares MariaDB chat tables and handles live events. Next.js SSR loads REST data and client hooks reconcile optimistic state with Socket.IO.

**Tech Stack:** Next.js 16, React 19, TypeScript, WordPress/PHP 8.4, MariaDB 11.8, Node 22, Socket.IO, mysql2, Docker Compose, Freestyle VM.

**Spec:** `docs/superpowers/specs/2026-09-11-realtime-chat-design.md`

## Global Constraints
- Preserve the existing chat visual design and route structure.
- Do not expose WordPress access tokens to browser JavaScript.
- MariaDB is the canonical message source of truth.
- Every send is idempotent using `client_id`.
- Membership/ownership authorization is enforced server-side.
- Realtime failure must not lose persisted messages.

---

### Task 1: Persistent chat REST backend
**Files:** backend migration, chat repository/controller, REST routes.
**Produces:** conversation list/detail/create, message history/send/edit/delete/reaction/read, socket ticket.
- [ ] Add chat tables and bump migration version.
- [ ] Add repository methods for membership, direct conversation creation, serialization and mutations.
- [ ] Add REST controller and authenticated routes.
- [ ] Add short-lived HMAC socket tickets.

### Task 2: Socket.IO service
**Files:** `realtime-chat/package.json`, `Dockerfile`, `src/server.mjs`, compose/deploy config.
**Consumes:** MariaDB chat schema and socket-ticket secret.
**Produces:** authenticated realtime rooms/events and `/health`.
- [ ] Verify signed tickets at handshake.
- [ ] Authorize room membership before join/mutations.
- [ ] Persist before acknowledgement/broadcast.
- [ ] Add typing, presence, reaction, edit/delete and read receipts.
- [ ] Add Docker healthcheck and Freestyle TLS route.

### Task 3: Frontend REST models
**Files:** `features/chat/types.ts`, `features/chat/services/chat.service.ts`, server routes/pages as needed.
**Produces:** real conversation/message DTO mapping and current viewer identity.
- [ ] Remove mock conversation/message stores.
- [ ] Read conversations and messages through Meydan REST proxy.
- [ ] Add create/send/edit/delete/reaction/read/ticket methods.

### Task 4: Frontend realtime client
**Files:** `package.json`, `features/chat/realtime/*`, `features/chat/hooks/useConversation.ts`, `useChat.ts`.
**Produces:** Socket.IO singleton and resilient realtime chat state.
- [ ] Add `socket.io-client`.
- [ ] Connect with short-lived ticket.
- [ ] Join/leave conversation rooms and listen for canonical events.
- [ ] Keep optimistic send with idempotent `clientId`, retry/failure and REST fallback.
- [ ] Reconcile on reconnect.

### Task 5: Wire existing UI
**Files:** existing chat components plus profile header where needed.
**Produces:** live unread counts, typing/presence/read state, real edit/delete/reaction/forward and direct-chat entry.
- [ ] Preserve current layout and composer.
- [ ] Expose connection/typing status without layout regressions.
- [ ] Start/open a direct conversation from another user's profile.

### Task 6: Verification and rollout
- [ ] Run/inspect frontend build and CI.
- [ ] Run/inspect backend deployment workflow and realtime health endpoint.
- [ ] Verify send/refresh/reconnect semantics before merging branches to `main`.
