## 1. Authentication system

- **NextAuth (web / prayer app)**
  - **Where**: `src/app/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/app/prayer/layout.tsx`, `src/01_App/(live) Gospel/Prayer/*`.
  - **What**: Google OAuth via `next-auth` with JWT sessions (no database adapter). `authOptions` copies `email`, `name`, `picture` from the provider user into the JWT and then into `session.user`.
  - **Usage**:
    - Client: `useSession`, `signIn`, `signOut` in prayer components such as `PrayerAuthControls`, `PrayerRoom`, `GroupAdmin`, `PrayerUpload`.
    - Server: `getServerSession(authOptions)` in prayer APIs such as `api/prayer/guided`, `api/prayer/groups/members`, `api/prayer/groups/[id]/join`, `api/prayer/groups/[id]/leave` to tie actions to `session.user.email`.
  - **Identity model**: Identity is “Google account”; `session.user.email` is treated as canonical `userId` in several prayer flows. No explicit user table or profile model.

- **Firebase Auth (mobile / System7 / some dev tooling)**
  - **Where**: `src/mobile/auth/useAuth.ts`, `src/mobile/auth/authActions.ts`, `src/app/components/GoogleLoginButton.tsx`, `src/03_Runtime/engine/system7/identity-auth-bridge.ts`, `src/app/layout.tsx`.
  - **What**: Standard Firebase Auth (Google + email/password) on the client. `useAuth` and `GoogleLoginButton` wrap Firebase sign-in/out, and `identity-auth-bridge` listens to Firebase auth state and exports a simple `IdentityPayload` (`userId`, `name`, `role`).
  - **Usage**:
    - Mobile and some TSX/system UI use Firebase directly for login.
    - System7 engine’s identity channel consumes `getIdentityPayload()` to know who the current user is (role is `"guest"` or `"user"`), but this is not wired into prayer-specific ACL.
  - **Identity model**: Firebase `uid` + display name/email, mapped into an engine-level identity snapshot separate from NextAuth sessions.

- **Shopify OAuth / merchant auth**
  - **Where**: `src/app/api/auth/install/route.ts`, `src/app/api/auth/callback/route.ts`, `src/app/lib/shopify-session.ts`.
  - **What**: Shopify app install + OAuth callback flow. Validates HMAC, exchanges `code` for `accessToken`, stores `{ shop, accessToken }` in an in-memory `Map` keyed by normalized shop domain, and sets a `shopify_shop` cookie.
  - **Identity model**: “Merchant” is identified by Shopify `shop` domain. Sessions are merchant-scoped, not end-user scoped.

- **Global guards / middleware**
  - **Where**: No `middleware.ts` in the repo.
  - **What**: There is no global auth guard; authentication is enforced (or not) on a per-route basis using `getServerSession` and ad-hoc checks.

---

## 2. Roles and permissions

- **Prayer group roles**
  - **Where**: `src/01_App/(live) Gospel/Prayer/data/store.ts`, `src/app/api/prayer/groups/*`, `src/01_App/(live) Gospel/Prayer/PrayerApp.tsx`, `src/01_App/(live) Gospel/Prayer/GroupAdmin.tsx`.
  - **Definition**: `GroupMemberRecord` with `role: "admin" | "member"`, alongside helpers `joinGroup`, `leaveGroup`, `getGroupMembers`.
  - **Behavior**:
    - Group creation (`POST /api/prayer/groups`) optionally sets `createdBy` and auto-joins the creator as `admin`.
    - Join/leave endpoints (`/api/prayer/groups/[id]/join`, `/leave`) require a NextAuth session and use `session.user.email` as `userId`.
    - Admin vs member is stored but not widely enforced on the server—most APIs just require membership, not admin role.

- **Prayer room roles (host / speaker / listener)**
  - **Where**: `src/01_App/(live) Gospel/Prayer/data/store.ts`, `src/01_App/(live) Gospel/Prayer/PrayerRoomTypes.ts`, `src/01_App/(live) Gospel/Prayer/PrayerRoom.tsx`, `PrayerRoomControls.tsx`, `room/usePrayerRoomWebRTC.ts`, `room/ModeratorPanel.tsx`, `src/app/api/prayer-room/*`.
  - **Definition**:
    - `RoomRecord` includes `hostId`, optional `groupId`, and `participants: RoomParticipantRecord[]`.
    - `RoomParticipantRecord.role` is `"host" | "speaker" | "listener"`.
  - **Behavior**:
    - Server join route enforces allowed roles and speaker capacity; may downgrade requested `speaker` to `listener`.
    - LiveKit token route grants `canPublish` only to host/speaker and `canSubscribe` to all participants, based on the stored role.
    - Host-only actions (mute others, end room) are enforced by checking `room.hostId === hostId` in APIs and `participantId === hostId` in client components.

- **Engine identity “role”**
  - **Where**: `src/03_Runtime/engine/system7/identity-auth-bridge.ts`, `src/05_Logic/logic/engine-system/universal-engine-adapter.ts`.
  - **Definition**: `IdentityPayload` with `role: string`, effectively `"guest"` when no Firebase user, `"user"` when signed in.
  - **Behavior**: This role is consumed by the System7 engine channel system, but is not currently used as an app-level authorization gate in the prayer or business apps.

- **Admin-ish flags**
  - **Where**: `src/01_App/(live) Gospel/Prayer/PrayerApp.tsx`, `src/lib/tsx-structure/getDefaultTsxEnvelopeProfile.ts`.
  - **Definition**:
    - Prayer app infers `isAdmin` and `isGroupAdmin` from the URL (`/prayer/admin`, `/prayer/admin/groups`).
    - TSX envelope profile has an `AppClass` type that includes `"admin"` but functions more as a classification tag than an enforced permission.
  - **Behavior**: Admin UIs for prayer (uploads, group admin) are gated by route, not by user identity or group role.

---

## 3. Groups / organizations

- **Prayer groups / memberships**
  - **Where**: `src/01_App/(live) Gospel/Prayer/data/store.ts`, `PrayerTypes.ts`, `GroupAdmin.tsx`, prayer group APIs.
  - **Model**:
    - Groups have IDs, slugs, names, logos, accent colors, descriptions, and `createdBy` (typically an email).
    - Memberships link `userId` (NextAuth email) and `groupId` with `role: "admin" | "member"`.
  - **Behavior**:
    - Anyone can create a group via the public create endpoint; creator becomes an admin member.
    - Join/leave flows are authenticated via NextAuth and manipulate membership records.
    - Rooms and prayers can be associated with `groupId`, giving a light “church/small-group” partitioning of content.

- **Business entities (organization-like)**
  - **Where**: `src/05_Logic/logic/business/*`, `src/01_App/(live) Business/workspace/*`, `src/app/api/business/*`.
  - **Model**:
    - A central business registry (with IDs and metadata) and workspace UI that lets users select a `businessId`.
    - CSV and Google Ads APIs take `businessId` and load configuration via `getBusinessById`.
  - **Behavior**:
    - This is effectively multi-business support, but there is no user–business membership model; access is scoped by the selected `businessId` in the client and query params on APIs.

- **Invitations**
  - **Where**: No concrete invite models or invite APIs in the main runtime code; “invite” appears mostly in docs and plans.
  - **Behavior**: Invitation flows for groups/orgs have not yet been implemented.

---

## 4. Onboarding flow

- **Engine-driven business onboarding (FlowViewer)**
  - **Where**: `src/01_App/(live) Business/onboarding/FlowViewer.tsx`.
  - **What**: Generic wizard controller that loads flows from an engine, applies decision/learning logic, and renders steps. It does not persist per-user completion; state lives in client state and URL.

- **Prayer Stream onboarding**
  - **Where**: `src/01_App/(live) Business/Prayer_Stream/PrayerStreamOnboarding.tsx`.
  - **What**: Wizard-like onboarding for a daily shared prayer habit. Tracks number of completions and last date via `localStorage` keys (`prayer-stream-count`, `prayer-stream-last`), but not tied to authenticated identity.

- **Legacy / “dead” onboarding flows**
  - **Where**: `src/01_App/(dead) Tsx/HiClarify/HiClarifyOnboarding.tsx`, `src/01_App/(dead) screens/tsx-screens/onboarding/premium-onboarding-tsx.tsx`.
  - **What**:
    - HiClarify onboarding uses a `hiclarify_entered_once` `localStorage` flag to skip onboarding after first entry.
    - Premium onboarding maintains a more complex session object in `localStorage` (`premium-onboarding-session-v1`) with education state and calculators.
  - **Pattern**: Onboarding state is local to the device/browser (via `localStorage`), not linked to auth systems (NextAuth/Firebase).

---

## 5. Session / room permissions

- **Host vs participant logic**
  - **Where**: `PrayerRoom.tsx`, `PrayerRoomControls.tsx`, `room/ModeratorPanel.tsx`, `room/usePrayerRoomWebRTC.ts`, `src/app/api/prayer-room/*`.
  - **Behavior**:
    - Roles: host, speaker, listener.
    - Only host/speaker publish audio; listeners receive only.
    - Host can end the room, mute other participants, control screen sharing, and control recording tools.
    - Server-side routes validate role values, room status, speaker capacity, and presence of the participant in the room.

- **Mute controls and moderator actions**
  - **Where**: `/api/prayer-room/mute`, WebRTC hooks, ModeratorPanel.
  - **Behavior**:
    - Server mute endpoint checks `room.hostId === hostId` before muting another participant (returns 403 otherwise).
    - When muting, the API both updates the room store (`muted` flag) and, if LiveKit credentials are configured, calls LiveKit to mute the media track.
    - ModeratorPanel surfaces these actions only for the host.

- **Trust boundaries**
  - **Identifiers**:
    - `hostId` and `participantId` are client-supplied strings (often email or a generated UUID) and are not cryptographically bound to NextAuth or Firebase identity.
  - **Media-layer permissions**:
    - LiveKit tokens are scoped to room ID and role; they enforce media permissions (publish/subscribe) even though the “user identity” is just the supplied participant ID.

---

## 6. Reusable infrastructure (for churches, organizations, business teams)

- **For churches / prayer groups**
  - Prayer groups + memberships provide a ready-made group model with admin/member roles and group-attached rooms and prayers.
  - NextAuth-backed group membership APIs already ensure “only signed-in users join/leave groups,” using email as identity.
  - Prayer room roles (host/speaker/listener) and LiveKit integration are reusable for any small-group audio room context (e.g., services, small groups, ministry teams).

- **For organizations / business teams**
  - Business registry and workspace layout provide a structure for multi-business dashboards with a selectable active organization.
  - Engine-driven onboarding flows (FlowViewer, Prayer Stream onboarding) are reusable patterns for organization-specific onboarding wizards.
  - Shopify merchant OAuth shows how to implement third-party, tenant-like auth using domains/IDs as org keys.

- **Common building blocks**
  - NextAuth session handling (Google OAuth + `getServerSession`) for web-based identity.
  - Firebase identity bridge feeding a generic `IdentityPayload` into the engine system.
  - JSON-backed data stores (`data/store.ts`) for groups, memberships, rooms, and prayers, which can be swapped for a database later.
  - The room/role model and LiveKit token issuing as a general-purpose real-time permission system for audio collaboration.

---

## 7. Gaps vs full organization-based onboarding & permissions

- **Unified user and organization model**
  - There is no central user model that unifies NextAuth users, Firebase users, and Shopify merchants into a single `User` with stable ID.
  - Organizations (churches, businesses, teams) are modeled inconsistently: prayer groups, businesses, and Shopify shops each have their own ID space and membership semantics.

- **Org-level login pages and dashboards**
  - Current login UX is prayer-centric (`/prayer` is the NextAuth sign-in page) rather than per-organization.
  - Admin and group admin views in the prayer app are selected via URL slugs instead of role-aware checks, and there is no consolidated organization admin dashboard.

- **Permissions enforcement**
  - Group admin vs member is stored but not consistently enforced at the API level for all admin operations.
  - Several APIs (e.g., prayer-room host actions) trust client-supplied `hostId`/`participantId` without verifying they correspond to the authenticated user.
  - There is no global middleware to enforce “must belong to organization X with role Y” across routes; each route implements its own minimal checks.

**Overall conclusion**: The repo already contains solid building blocks for organization-like behavior—prayer groups with roles, business registry and workspaces, multi-provider auth, and robust room/role permissions—but it lacks a unified user/org model, org-scoped login surfaces, and consistently enforced, role-aware admin permissions needed for a full multi-organization onboarding and permissions system for churches, businesses, or teams.

