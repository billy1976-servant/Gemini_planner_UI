---
name: Prayer Platform Auth Org Permissions
overview: One A-to-Z implementation plan to finish universal authentication, organization/tenant layer, permissions enforcement, stabilization (annotation sync, Safari recording, replay seek, recording safety), multi-org platform, org admin panel, invite flow, org-aware onboarding, session compatibility, backward compatibility, and build validation for the prayer app—reusing all existing systems and specifying exact file changes in execution order.
todos: []
isProject: false
---

SYSTEM TASK: GENERATE ONE EXECUTABLE BUILD PLAN (NO IMPLEMENTATION YET)



Scan the entire repository and produce ONE COMPLETE IMPLEMENTATION PLAN

to finish the platform architecture for the prayer application.



IMPORTANT RULES

- DO NOT implement anything yet

- DO NOT create multiple plans

- DO NOT create sub-plans or “plans for plans”

- Generate ONE A→Z implementation sequence that can be executed directly

- The plan must assume it will be run once in Cursor Agent mode

- The plan must include exact file changes and execution order



The final plan must combine:



1) UNIVERSAL AUTHENTICATION

2) ORGANIZATION / TENANT LAYER

3) PERMISSIONS & ROLE ENFORCEMENT

4) PHASE F — STABILIZATION & COLLABORATION

5) PHASE G — MULTI-ORGANIZATION PLATFORM

6) ONBOARDING

7) ADMIN PANELS

8) BUILD VALIDATION



The plan must reuse existing systems wherever possible.



---------------------------------------------------

PHASE A — REPOSITORY ANALYSIS

---------------------------------------------------



Scan and map the current implementations:



NextAuth

Firebase auth bridge

identity-auth-bridge.ts

prayer groups

prayer room APIs

LiveKit integration

annotation overlay

PrayerRoomRecorder

ReplayTimeline

SessionEngine

business registry

existing onboarding flows



Identify what exists vs what must be extended.



Do NOT redesign architecture if it already works.



---------------------------------------------------

PHASE B — UNIVERSAL IDENTITY LAYER

---------------------------------------------------



Create or extend a unified identity model:



UserRecord

id

email

displayName

providers

createdAt



Update NextAuth callbacks so:



[session.user.id](http://session.user.id) = internal userId



Update identity bridge so engine can access:



userId

displayName

role

organizations

activeOrganization



---------------------------------------------------

PHASE C — ORGANIZATION MODEL

---------------------------------------------------



Create:



Organization

id

name

slug

logo

palette

createdAt

ownerId



Membership

userId

organizationId

role

("owner" | "admin" | "moderator" | "member" | "guest")



Link existing prayer groups to organizations safely.



---------------------------------------------------

PHASE D — PERMISSION ENFORCEMENT

---------------------------------------------------



Add server helpers:



requireAuthenticatedUser()

requireOrgMembership()

requireOrgRole()



Apply to:



prayer-room APIs

group management APIs

admin APIs

recordings

moderator controls



Remove trust of client supplied:



hostId

participantId



Use [session.user.id](http://session.user.id) instead.



---------------------------------------------------

PHASE E — PRAYER ROOM SECURITY

---------------------------------------------------



Bind rooms to real users:



hostUserId

participantUserId



Update:



/api/prayer-room/create

/api/prayer-room/join

/api/prayer-room/token

/api/prayer-room/mute

/api/prayer-room/end



Ensure LiveKit permissions remain correct.



---------------------------------------------------

PHASE F — STABILIZATION & COLLABORATION

---------------------------------------------------



1. Annotation synchronization



Broadcast strokes through LiveKit data channel.



Host publishes:

{

type:"annotation_stroke",

stroke

}



Clients listen on RoomEvent.DataReceived and append strokes.



Only host editable.



2. Safari recording compatibility



Recorder MIME fallback order:



audio/webm;codecs=opus

audio/webm

audio/mp4



Ensure /api/prayer/audio accepts:



webm

mp4



3. Replay timeline seeking



ReplayTimeline markers trigger:



onSeek(timestampSec)



Connect to PrayerPlayer seek.



4. Recording safety



Stop recording when LiveKit disconnects.



Prevent duplicate screen share sessions.



---------------------------------------------------

PHASE G — MULTI-ORGANIZATION PLATFORM

---------------------------------------------------



Add tenant support without breaking prayer features.



Create route:



/org/[slug]/page.tsx



Resolver must:



load organization

apply palette

scope data queries



Extend records with optional organizationId:



Prayer

Room

Session

Recording

StudyPage

Group



---------------------------------------------------

PHASE H — ORGANIZATION ADMIN PANEL

---------------------------------------------------



Create:



/org/[slug]/admin



Allow admins to:



manage members

manage groups

create live sessions

assign moderators

view recordings



---------------------------------------------------

PHASE I — INVITE FLOW

---------------------------------------------------



Implement invite system:



POST /api/org/invite



Join route:



/org/[slug]/join?token=



Creates Membership record.



---------------------------------------------------

PHASE J — ONBOARDING

---------------------------------------------------



Implement org-aware onboarding.



Owner onboarding:



create first group

create first live session

configure organization branding



Member onboarding:



join org

join group

enter prayer room



Reuse FlowViewer where possible.



---------------------------------------------------

PHASE K — SESSION ENGINE COMPATIBILITY

---------------------------------------------------



Extend session parameters:



{

sessionType:"prayer|study|meeting|teaching",

organizationId:"...",

features:["audio","recording","screenShare","annotations"]

}



SessionEngine must respect organizationId.



---------------------------------------------------

PHASE L — BACKWARDS COMPATIBILITY

---------------------------------------------------



Preserve:



PrayerPlayer

LiveKit integration

prayer feed

existing groups

existing APIs



Do NOT duplicate endpoints.



Continue using:



POST /api/prayer for recordings.



---------------------------------------------------

PHASE M — BUILD VALIDATION

---------------------------------------------------



Final steps:



run npm run build



Fix all TypeScript errors.



Confirm:



prayer rooms function

annotation sync works

Safari recording fallback works

organization routes load

admin panel loads



---------------------------------------------------



OUTPUT FORMAT



Return ONE FINAL IMPLEMENTATION PLAN in ordered steps.



Do NOT implement anything yet.



The plan must be executable directly later in Cursor Agent mode without creating another plan.



  
