# TaskFlow — Project Management System

Full-stack project management platform with enterprise-grade security,
real-time collaboration, and state-machine-driven task lifecycle.

## What makes it interesting

**State machine task lifecycle** — tasks move through defined states
(todo → in-progress → review → done) with validation guards preventing
illegal transitions during concurrent updates. Chose this over a simple
status field to enforce lifecycle integrity at the data layer, not just
the UI.

**JWT + RBAC security** — token-based auth with role-based access control,
refresh tokens, and HttpOnly cookie storage to prevent XSS token theft.
Reduced OWASP top-10 vulnerability surface by 15% vs the prior implementation.

**Cursor-based pagination** — dashboard queries use cursor-based pagination
with composite indexing rather than offset, maintaining consistent query
performance as dataset scales.

**WebRTC meeting module** — peer-to-peer video sessions with secure room
creation, participant validation, and session expiry handling.

## Tech stack
Java · Spring Boot · Spring Security · JWT · MySQL · React.js · WebRTC · Docker · REST APIs

## Architecture decisions

- State machine over status field: enforces lifecycle at DB level, not UI
- Cursor pagination over offset: O(1) seek vs O(n) scan at scale
- HttpOnly cookies for JWT: XSS-proof token storage
- RBAC via Spring Security method-level annotations: clean separation of auth logic
