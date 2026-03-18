---
name: auth_onboarding_permissions_audit
overview: Analyze the existing authentication, roles/permissions, groups/organizations, onboarding, and session/room logic across the repo and produce a structured markdown report (AUTH_ONBOARDING_SYSTEM_REPORT.md) without modifying any code.
todos:
  - id: map-auth-systems
    content: Fully document all authentication systems (NextAuth, Firebase, Shopify) and how sessions are created, stored, and accessed.
    status: completed
  - id: catalog-roles-permissions
    content: Catalog all roles and permissions (group roles, room roles, engine identity roles, admin flags) and where checks are enforced.
    status: completed
  - id: document-groups-organizations
    content: Describe group, organization, business, and membership models, and how users join or are associated with them.
    status: completed
  - id: analyze-onboarding-flows
    content: Analyze all onboarding and first-run flows and how they determine new vs returning users.
    status: completed
  - id: detail-session-room-permissions
    content: Detail host vs participant session/room permissions across client and server for the prayer room system.
    status: completed
  - id: identify-reusable-infra
    content: Identify which existing primitives are reusable for churches, organizations, and business teams.
    status: completed
  - id: summarize-gaps-org-support
    content: Summarize key gaps for multi-organization support, org-level login pages, and admin dashboards.
    status: completed
  - id: write-auth-onboarding-report
    content: Write AUTH_ONBOARDING_SYSTEM_REPORT.md in the repo root using the agreed structure and findings.
    status: completed
isProject: false
---

## Auth & Onboarding System Analysis Plan

### 1. Map authentication systems

- **NextAuth (web/prayer)**
  - Review `authOptions` and callbacks in `[src/app/lib/auth.ts](src/app/lib/auth.ts)`.
  - Inspect NextAuth route handler in `[src/app/api/auth/[...nextauth]/route.ts](src/app/api/auth/%5B...nextauth%5D/route.ts)`.
  - Trace client usage of `useSession`, `signIn`, and `signOut` in prayer-related components such as `[src/01_App/(live) Gospel/Prayer/PrayerAuthControls.tsx](src/01_App/(live)`%20Gospel/Prayer/PrayerAuthControls.tsx), `[PrayerRoom.tsx](src/01_App/(live)`%20Gospel/Prayer/PrayerRoom.tsx), `[GroupAdmin.tsx](src/01_App/(live)`%20Gospel/Prayer/GroupAdmin.tsx), and `[PrayerUpload.tsx](src/01_App/(live)`%20Gospel/Prayer/PrayerUpload.tsx).
  - Document how `getServerSession(authOptions)` is used in prayer APIs (e.g. `[src/app/api/prayer/guided/route.ts](src/app/api/prayer/guided/route.ts)`, `[src/app/api/prayer/groups/members/route.ts](src/app/api/prayer/groups/members/route.ts)`, group join/leave routes) and how email/name are propagated.
- **Firebase Auth (mobile/System7/dev tools)**
  - Summarize Firebase auth hooks and actions from `[src/mobile/auth/useAuth.ts](src/mobile/auth/useAuth.ts)`, `[src/mobile/auth/authActions.ts](src/mobile/auth/authActions.ts)`, and `[src/app/components/GoogleLoginButton.tsx](src/app/components/GoogleLoginButton.tsx)`.
  - Describe the System7 identity bridge in `[src/03_Runtime/engine/system7/identity-auth-bridge.ts](src/03_Runtime/engine/system7/identity-auth-bridge.ts)` and its hookup in `[src/app/layout.tsx](src/app/layout.tsx)`.
- **Shopify OAuth / merchant auth**
  - Capture the install and callback flows from `[src/app/api/auth/install/route.ts](src/app/api/auth/install/route.ts)`, `[src/app/api/auth/callback/route.ts](src/app/api/auth/callback/route.ts)`, and the in-memory store `[src/app/lib/shopify-session.ts](src/app/lib/shopify-session.ts)`.
- **Global middleware / guards**
  - Confirm the absence of `middleware.ts` and note that auth is enforced per-route only.

### 2. Catalog roles and permissions

- **Prayer group roles**
  - Detail `GroupMemberRecord` ("admin" | "member") and helpers from `[src/01_App/(live) Gospel/Prayer/data/store.ts](src/01_App/(live)`%20Gospel/Prayer/data/store.ts).
  - Map where group membership and roles are used in APIs: `[src/app/api/prayer/groups/route.ts](src/app/api/prayer/groups/route.ts)`, `[src/app/api/prayer/groups/[id]/join/route.ts](src/app/api/prayer/groups/%5Bid%5D/join/route.ts)`, `[src/app/api/prayer/groups/[id]/leave/route.ts](src/app/api/prayer/groups/%5Bid%5D/leave/route.ts)`, and how `getServerSession` ties membership to NextAuth email.
- **Prayer room roles & permissions**
  - Describe `RoomRecord`, `RoomParticipantRecord`, and room roles (host/speaker/listener) from `data/store.ts` and the room type definitions.
  - Summarize server-side constraints in room APIs: join/token/mute/end routes under `[src/app/api/prayer-room](src/app/api/prayer-room)`, focusing on how host-only actions and publish/subscribe rights are enforced.
  - Summarize client-side permission checks in `[PrayerRoom.tsx](src/01_App/(live)`%20Gospel/Prayer/PrayerRoom.tsx), `[PrayerRoomControls.tsx](src/01_App/(live)`%20Gospel/Prayer/PrayerRoomControls.tsx), and `[room/ModeratorPanel.tsx](src/01_App/(live)`%20Gospel/Prayer/room/ModeratorPanel.tsx).
- **Engine identity role**
  - Note the generic `role` field in `IdentityPayload` (guest vs user) in `identity-auth-bridge.ts` and that it is not wired into explicit app-level ACL in the prayer app.
- **Other admin-ish flags**
  - Capture URL-based admin flags in `[PrayerApp.tsx](src/01_App/(live)`%20Gospel/Prayer/PrayerApp.tsx) and the TSX `AppClass` variants (including "admin") in `[src/lib/tsx-structure/getDefaultTsxEnvelopeProfile.ts](src/lib/tsx-structure/getDefaultTsxEnvelopeProfile.ts)`, clarifying that they do not currently enforce authentication/authorization.

### 3. Document groups / organizations / membership

- **Prayer groups and memberships**
  - Describe the group model and membership store in `data/store.ts` and types in `[PrayerTypes.ts](src/01_App/(live)`%20Gospel/Prayer/PrayerTypes.ts).
  - Explain how users join/leave groups via the API and how creator-as-admin is implemented.
  - Note how rooms optionally attach `groupId` and how that flows into prayers/recordings.
- **Business / organization-like entities**
  - Summarize the business registry and selection model from logic files under `[src/05_Logic/logic/business](src/05_Logic/logic/business)` and workspace UI under `[src/01_App/(live) Business/workspace](src/01_App/(live)`%20Business/workspace).
  - Clarify that business access is scoped by selected `businessId` rather than per-user membership/roles.
- **Invitations**
  - Confirm that there are no dedicated invitation models or invite APIs in the main paths you care about (only textual mentions in plans/docs).

### 4. Analyze onboarding and first-run flows

- **Business onboarding wizards**
  - Detail the engine-driven FlowViewer in `[src/01_App/(live) Business/onboarding/FlowViewer.tsx](src/01_App/(live)`%20Business/onboarding/FlowViewer.tsx) and how it orchestrates onboarding steps, without per-user completion flags.
  - Describe the `PrayerStreamOnboarding` wizard in `[src/01_App/(live) Business/Prayer_Stream/PrayerStreamOnboarding.tsx](src/01_App/(live)`%20Business/Prayer_Stream/PrayerStreamOnboarding.tsx) and its use of `localStorage` to track counts/last activity.
- **Legacy / dead onboarding flows**
  - Summarize `HiClarifyOnboarding` and `premium-onboarding-tsx` under `src/01_App/(dead)` to capture existing onboarding patterns (localStorage-based first-run flags and saved sessions).
- **First-time detection mechanisms**
  - Enumerate all uses of localStorage keys for onboarding/first-run (e.g., `hiclarify_entered_once`, `premium-onboarding-session-v1`, `prayer-stream-count`, `prayer-stream-last`) and highlight the absence of user-level onboarding state in central auth/session stores.

### 5. Detail session/room permissions

- **Host vs participant capabilities**
  - Consolidate how host/speaker/listener roles map to capabilities: publishing audio, muting others, ending rooms, recording, and screen share, across client (PrayerRoom, controls, ModeratorPanel, WebRTC hook) and server routes (join, token, mute, end).
- **Trust boundaries**
  - Note that `hostId` and `participantId` are client-supplied identifiers (often but not necessarily emails) and are not verified against NextAuth or Firebase identity.
  - Clarify how LiveKit token generation adds an independent layer of media-level permissions based on role.

### 6. Identify reusable infrastructure

- **For churches / prayer groups**
  - Describe how existing prayer groups, group memberships, group-attached rooms, and recordings could generalize to church/organization contexts.
- **For organizations / business teams**
  - Highlight business registry, workspace multi-business selection, and engine-based onboarding flows as reusable primitives for multi-team onboarding experiences.
- **Common building blocks**
  - Call out shared pieces such as NextAuth session handling, Firebase identity bridge, JSON-backed data stores (`data/store.ts`), and the room/role model as potential foundations for org-based permissions.

### 7. Surface gaps vs desired org-based model

- **Multi-organization support gaps**
  - Point out lack of a unified user model tying identities from NextAuth, Firebase, and Shopify together.
  - Note absence of explicit organization/tenant entities with stable IDs, per-user membership records, and role assignments beyond prayer groups.
- **Org-level login pages and dashboards**
  - Highlight that current login UX is prayer-centric (`/prayer`), not per-organization, and that admin dashboards are URL-based rather than auth-based.
- **Security and enforcement gaps**
  - Document where server routes rely on client-supplied IDs (e.g., `hostId`) without verifying against authenticated identity.
  - List where admin/group roles exist in data but are not consistently enforced on APIs.

The final report will be written to `AUTH_ONBOARDING_SYSTEM_REPORT.md` in the repo root, mirroring this structure with concrete file references and narrative explanations focused on whether the current system already supports organization-based onboarding and permissions.