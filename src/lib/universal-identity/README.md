# Universal Identity

**Rule: No module or app may create or manage its own user identity. All identity must resolve through Universal Identity.**

- Use `getOrCreateUserByEmail` / `getUserById` from this module for user resolution.
- Use `getCurrentIdentity()` from the identity-auth-bridge on the client for full identity (userId, email, displayName, organizations, activeOrgId).
- Use `getServerSession(authOptions)` in API routes and then `session.user.id` (stable internal userId) for authorization.
- Do not generate ad-hoc user identifiers (e.g. random UUID as userId or participantId); use `session.user.id` from the bridge/NextAuth.
