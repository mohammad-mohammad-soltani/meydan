# Realtime Chat Design

> **SUPERSEDED.** The Socket.IO service and `POST /chat/socket-ticket` this
> document describes were replaced by the unified Pusher-compatible Soketi
> transport. See the superseded banner in
> `docs/superpowers/plans/2026-09-11-realtime-chat.md` for the current
> architecture. Kept for history only.

## Goal
Replace the current mock chat data with authenticated, persistent, realtime direct messaging while preserving the existing Meydan chat UI.

## Architecture
WordPress remains the authoritative REST/auth layer and MariaDB remains the source of truth. A dedicated Socket.IO service runs beside WordPress on the same Freestyle VM and uses the same MariaDB chat tables. Next.js uses REST for initial SSR/history and Socket.IO for live updates.

## Authentication
The browser never receives the WordPress access token. It requests `POST /chat/socket-ticket` through the existing `/api/meydan` proxy. WordPress returns a short-lived HMAC-signed ticket containing the authenticated user id and expiry. Socket.IO verifies that ticket before accepting a connection.

## Persistence
Add tables for conversations, participants, messages, and reactions. Messages are idempotent per sender/client id. Read state is stored per participant. Message history survives refresh/reconnect and is available over REST.

## REST API
- `GET /chat/conversations`
- `POST /chat/conversations`
- `GET /chat/conversations/{id}`
- `GET /chat/conversations/{id}/messages`
- `POST /chat/conversations/{id}/messages`
- `PATCH /chat/messages/{id}`
- `DELETE /chat/messages/{id}`
- `PUT /chat/messages/{id}/reaction`
- `DELETE /chat/messages/{id}/reaction`
- `PUT /chat/conversations/{id}/read`
- `POST /chat/socket-ticket`

## Socket.IO events
Client to server: `conversation:join`, `conversation:leave`, `message:send`, `message:edit`, `message:delete`, `message:react`, `typing:start`, `typing:stop`, `receipt:read`.

Server to client: `message:created`, `message:updated`, `message:deleted`, `message:reaction`, `typing:changed`, `receipt:read`, `presence:changed`, `conversation:updated`, `chat:error`.

## Delivery semantics
The client creates an optimistic message with a random `clientId`. The realtime server inserts or resolves the canonical row using the `(sender_user_id, client_id)` uniqueness key, then acknowledges and broadcasts the canonical message. Retries therefore do not duplicate messages.

## Failure handling
If realtime disconnects, the UI shows reconnecting state and can fall back to REST send. On reconnect it refetches the current conversation message window and reconciles by message id/client id.

## Scope
This implementation covers persistent direct conversations, message send/edit/delete/forward, reactions, typing, presence, read receipts, unread counts, reconnect/retry, and existing attachment metadata. Group-ready schema is included, but group-management UI is outside this phase.
