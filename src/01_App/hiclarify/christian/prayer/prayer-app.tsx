"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, SessionProvider } from "next-auth/react";
import { PrayerShare } from "./PrayerShare";
import { PrayerLibrary } from "./prayer-library";
import { PrayerUpload } from "./PrayerUpload";
import { GroupAdmin } from "./GroupAdmin";
import { PrayerRoom } from "./prayer-room";
import { PrayerFlowWrapper } from "./flow/PrayerFlowWrapper";
import { ActiveRoomsProvider } from "./room/ActiveRoomsContext";
import { LivePrayerCta } from "./LivePrayerCta";
import { useState as useClientState } from "react";
import { LiveSection } from "./live/LiveSection";
import { MomentsSection } from "./moments/MomentsSection";
import { GuidedSection } from "./guided/GuidedSection";
import { CommunitySection } from "./community/CommunitySection";
import { GuidedPrayerCreate } from "./guided/GuidedPrayerCreate";
import { PrayerAuthControls } from "./PrayerAuthControls";
import { PrayerTimerSelector } from "./prayer-timer-selector";
import { PlayerModule } from "../../../../components/prayer/PlayerModule";
import { RecorderModule } from "../../../../components/prayer/RecorderModule";
import { SnapshotsPanel } from "./SnapshotsPanel";
import {
  getPrayers,
  getPrayer,
  getGroups,
  getGroupBySlug,
  getLiveCount,
  getLiveCountByGroup,
  getGroupLogoUrl,
  getPresence,
  recordPlayed,
  joinSession,
  heartbeatSession,
  leaveSession,
} from "./api/prayer-api";
import type { Prayer, Group } from "./PrayerTypes";
import { useTheme } from "../../../../components/ui/ThemeProvider";
import type { PaletteId } from "@/lib/ui/palette";
import { formatDuration } from "./utils/formattime";
import "./prayer-theme.css";

const PLATFORM_SECTIONS = ["live", "moments", "guides", "community"] as const;
type PlatformSection = (typeof PLATFORM_SECTIONS)[number];

export type PrayerMode = "player" | "record" | "live";

function isPlatformSection(s: string): s is PlatformSection {
  return PLATFORM_SECTIONS.includes(s as PlatformSection);
}

const HEARTBEAT_INTERVAL_MS = 20_000;
const LIVE_POLL_INTERVAL_MS = 20_000;

export interface PrayerAppProps {
  slug?: string[];
  baseUrl?: string;
  /** Base path for all app links (e.g. /prayer or /christian/prayer). Passed by the router; do not derive from pathname. */
  basePath?: string;
  showAdmin?: boolean;
}

function getAudioUrl(audioUrl: string): string {
  if (audioUrl.startsWith("http") || audioUrl.startsWith("/")) return audioUrl;
  return `/api/prayer/audio?path=${encodeURIComponent(audioUrl)}`;
}

/**
 * Inner app component that uses useSession; must be rendered inside SessionProvider.
 */
function PrayerAppInner({ slug = [], baseUrl, basePath = "/prayer", showAdmin: showAdminProp }: PrayerAppProps) {
  const router = useRouter();
  const prayerBase = basePath;
  const { data: session } = useSession();
  const { palette, paletteId, setPaletteId } = useTheme();
  const [current, setCurrent] = useState<Prayer | null>(null);
  const [allPrayers, setAllPrayers] = useState<Prayer[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupLoading, setGroupLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [prayerTextOpen, setPrayerTextOpen] = useState(false);
  const [totalListeners, setTotalListeners] = useState<number>(0);
  const [liveCount, setLiveCount] = useState<number>(0);
  const [presenceTotal, setPresenceTotal] = useState<number>(0);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [seekToSec, setSeekToSec] = useState<number | null>(null);
  const [mode, setMode] = useState<PrayerMode>("player");
  const [contextToolsOpen, setContextToolsOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [snapshotsOpen, setSnapshotsOpen] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    setShareUrl(
      baseUrl ||
        (typeof window !== "undefined"
          ? `${window.location.origin}${prayerBase}${group ? `/${group.slug}` : ""}${current?.id ? `/${current.id}` : ""}`
          : "")
    );
  }, [baseUrl, prayerBase, group?.slug, current?.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const g = await getGroups();
        if (!cancelled) setGroups(Array.isArray(g) ? g : []);
      } catch {
        if (!cancelled) setGroups([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Reserved path segments (not group slugs)
  const RESERVED = ["live", "guides", "community", "moments", "admin", "room", "groups", "prayer", "today", "onboarding"] as const;
  const sectionNames = ["live", "guides", "community", "moments"] as const;

  // Detect platform section anywhere in slug: /prayer/live, /prayer/lewisburg-guys/live, etc.
  const platformSection: PlatformSection | null =
    (slug?.find((s) => sectionNames.includes(s as (typeof sectionNames)[number])) as PlatformSection) ?? null;

  // Room: detect "room" anywhere in slug and use next segment as roomId (works with or without leading "prayer")
  const roomIdx = slug?.indexOf("room") ?? -1;
  const isRoom = roomIdx >= 0 && !!slug?.[roomIdx + 1];
  const roomId: string | null = isRoom && slug ? slug[roomIdx + 1] ?? null : null;

  // Group slug: first segment that is not reserved and not the room ID (segment after "room")
  const groupSlug: string | null =
    slug?.find((s, i) => {
      if (RESERVED.includes(s as (typeof RESERVED)[number])) return false;
      if (isRoom && roomId != null && i === roomIdx + 1) return false;
      return true;
    }) ?? null;

  const isAdmin = showAdminProp || (slug?.includes("admin") ?? false);
  const adminIdx = slug?.indexOf("admin") ?? -1;
  const isGroupAdmin = adminIdx >= 0 && slug?.[adminIdx + 1] === "groups";

  let prayerSlug: string | null = null;
  let idFromSlug: string | null = null;

  if (groupSlug) {
    const groupIdx = slug?.indexOf(groupSlug) ?? -1;
    const nextSegment = groupIdx >= 0 ? slug?.[groupIdx + 1] : undefined;
    prayerSlug =
      nextSegment && !sectionNames.includes(nextSegment as (typeof sectionNames)[number]) && nextSegment !== "admin" && nextSegment !== "groups"
        ? nextSegment
        : null;
  } else {
    idFromSlug =
      slug?.[0] && !RESERVED.includes(slug[0] as (typeof RESERVED)[number]) && !isPlatformSection(slug[0])
        ? slug[0]
        : null;
  }

  useEffect(() => {
    if (groupSlug) {
      setGroupLoading(true);
      getGroupBySlug(groupSlug)
        .then((g) => {
          setGroup(g ?? null);
        })
        .catch(() => setGroup(null))
        .finally(() => setGroupLoading(false));
    } else {
      setGroupLoading(false);
      setGroup(Array.isArray(groups) && groups.length > 0 ? groups[0] : null);
    }
  }, [groupSlug, groups]);

  const loadPrayers = useCallback(
    (isRetry?: boolean) => {
      setLoading(true);
      const groupId = group?.id ?? null;
      getPrayers(groupId)
        .then((list) => {
          const published = list.filter((p) => p.published);
          setAllPrayers(published);
          if (published.length === 0 && !isRetry) {
            setTimeout(() => loadPrayers(true), 800);
          }
        })
        .catch(() => setAllPrayers([]))
        .finally(() => setLoading(false));
    },
    [group?.id]
  );

  useEffect(() => {
    if (isGroupAdmin) return;
    if (groupSlug && !group) return;
    loadPrayers();
  }, [loadPrayers, isGroupAdmin, groupSlug, group]);

  useEffect(() => {
    if (groupSlug && prayerSlug) {
      const found = allPrayers.find((p) => p.id === prayerSlug);
      if (found) setCurrent(found);
      else if (!loading) getPrayer(prayerSlug).then((p) => p && setCurrent(p));
      return;
    }
    if (groupSlug) {
      if (allPrayers.length > 0) {
        setCurrent((prev) => (prev && allPrayers.some((p) => p.id === prev.id) ? prev : allPrayers[0]));
      } else if (!loading) setCurrent(null);
      return;
    }
    if (idFromSlug) {
      const found = allPrayers.find((p) => p.id === idFromSlug);
      if (found) setCurrent(found);
      else if (!loading && allPrayers.length === 0) {
        getPrayer(idFromSlug).then((p) => p && setCurrent(p));
      }
      return;
    }
    if (allPrayers.length > 0) {
      setCurrent((prev) => (prev && allPrayers.some((p) => p.id === prev.id) ? prev : allPrayers[0]));
    } else if (!loading) {
      setCurrent(null);
    }
  }, [groupSlug, prayerSlug, idFromSlug, allPrayers, loading]);

  useEffect(() => {
    if (current) {
      setTotalListeners(current.totalListeners ?? 0);
    } else {
      setTotalListeners(0);
    }
  }, [current?.id, current?.totalListeners]);

  useEffect(() => {
    if (group?.id) {
      const tick = () => getLiveCountByGroup(group.id).then(setLiveCount);
      tick();
      const id = setInterval(tick, LIVE_POLL_INTERVAL_MS);
      return () => clearInterval(id);
    }
    if (!current?.id) return;
    const tick = () => getLiveCount(current.id).then(setLiveCount);
    tick();
    const id = setInterval(tick, LIVE_POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [group?.id, current?.id]);

  useEffect(() => {
    const tick = () => getPresence().then((p) => setPresenceTotal(p.total));
    tick();
    const id = setInterval(tick, LIVE_POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const handlePlayingChange = useCallback(
    (playing: boolean) => {
      setIsPlaying(playing);
      const pid = current?.id;
      if (!pid) return;
      if (playing) {
        recordPlayed(pid).then((r) => setTotalListeners(r.totalListeners));
        joinSession(pid).then((r) => {
          if (r?.sessionId) sessionIdRef.current = r.sessionId;
        });
      } else {
        const sid = sessionIdRef.current;
        if (sid) {
          leaveSession(sid);
          sessionIdRef.current = null;
        }
      }
    },
    [current?.id]
  );

  useEffect(() => {
    if (!isPlaying || !current?.id || !sessionIdRef.current) return;
    const id = setInterval(() => {
      if (sessionIdRef.current) heartbeatSession(current.id, sessionIdRef.current);
    }, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isPlaying, current?.id]);

  useEffect(() => {
    const onUnload = () => {
      const sid = sessionIdRef.current;
      if (sid) {
        leaveSession(sid);
        sessionIdRef.current = null;
      }
    };
    window.addEventListener("beforeunload", onUnload);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        const sid = sessionIdRef.current;
        if (sid) {
          leaveSession(sid);
          sessionIdRef.current = null;
        }
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      document.removeEventListener("visibilitychange", onVisibility);
      const sid = sessionIdRef.current;
      if (sid) {
        leaveSession(sid);
        sessionIdRef.current = null;
      }
    };
  }, []);

  const handleGroupChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (platformSection) {
        const path = value ? `${prayerBase}/${value}/${platformSection}` : `${prayerBase}/${platformSection}`;
        router.push(path);
      } else {
        const path = value ? `${prayerBase}/${value}` : prayerBase;
        router.push(path);
      }
    },
    [prayerBase, platformSection, router]
  );

  const audioSrc = current?.audioUrl ? getAudioUrl(current.audioUrl) : null;

  const paletteStyle = {
    "--prayer-bg-start": palette.background,
    "--prayer-card-bg": palette.surface,
    "--prayer-text": palette.textPrimary,
    "--prayer-text-muted": palette.textSecondary,
    "--prayer-text-subtle": palette.textSecondary,
    "--prayer-accent": palette.accent,
    "--prayer-card-border": palette.border,
    "--prayer-play-bg": palette.playBg ?? palette.accent,
    "--prayer-play-bg-hover": palette.playBgHover ?? palette.accent,
    "--prayer-wave": palette.wave ?? `${palette.accent}73`,
    "--prayer-wave-active": palette.waveActive ?? palette.accent,
  } as React.CSSProperties;
  const platformStyle = group?.accentColor
    ? ({
        "--prayer-play-bg": group.accentColor,
        "--prayer-play-bg-hover": group.accentColor,
        "--prayer-accent": group.accentColor,
        "--prayer-accent-hover": group.accentColor,
        "--prayer-wave": `${group.accentColor}73`,
        "--prayer-wave-active": group.accentColor,
      } as React.CSSProperties)
    : undefined;

  if (isRoom && roomId) {
    return <PrayerRoom roomId={roomId} prayerBase={prayerBase} />;
  }

  const isOnboarding = slug?.includes("onboarding") ?? false;
  if (isOnboarding) {
    return (
      <PrayerFlowWrapper
        prayerBase={prayerBase}
        flowId="prayer-onboarding"
        configUrl="/api/prayer-flow-config"
        className="prayer-flow-onboarding"
      />
    );
  }

  if (isGroupAdmin) {
    return (
      <div className="prayer-platform" style={{ padding: "2rem 1rem 4rem" }}>
        <div style={{ maxWidth: 420, margin: "0 auto 1.5rem", textAlign: "center" }}>
          <Link href={`${prayerBase}/admin`} className="prayer-share-link" style={{ fontSize: "0.875rem" }}>
            ← Prayer admin
          </Link>
        </div>
        <GroupAdmin prayerBase={prayerBase} />
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="prayer-platform" style={{ padding: "2rem 1rem 4rem" }}>
        <div style={{ maxWidth: 420, margin: "0 auto 1.5rem", textAlign: "center" }}>
          <Link href={prayerBase} className="prayer-share-link" style={{ fontSize: "0.875rem" }}>
            ← Back to prayer
          </Link>
          {" · "}
          <Link href={`${prayerBase}/admin/groups`} className="prayer-share-link" style={{ fontSize: "0.875rem" }}>
            Groups
          </Link>
        </div>
        <PrayerUpload
          onUploaded={(p) => {
            setAllPrayers((prev) => [p, ...prev]);
            setCurrent(p);
            loadPrayers();
          }}
        />
        <GuidedPrayerCreate />
      </div>
    );
  }

  if (groupSlug && !groupLoading && !group) {
    return (
      <div className="prayer-platform" style={{ padding: "2rem 1rem 4rem" }}>
        <section className="prayer-hero-card">
          <div className="prayer-brand">Prayer</div>
          <p className="prayer-subtitle">Group not found.</p>
          <div style={{ marginTop: "1rem" }}>
            <Link href={prayerBase} className="prayer-share-link">← Back to prayer</Link>
          </div>
        </section>
      </div>
    );
  }

  const effectiveGroupSlug = group?.slug ?? groupSlug;
  const navPrayerHref = effectiveGroupSlug ? `${prayerBase}/${effectiveGroupSlug}` : prayerBase;
  const sectionPath = (section: PlatformSection) => (effectiveGroupSlug ? `${prayerBase}/${effectiveGroupSlug}/${section}` : `${prayerBase}/${section}`);

  const isOnMain = !platformSection && !isAdmin && !isGroupAdmin && !isRoom;
  const isOnLive = platformSection === "live";
  const isOnGuided = platformSection === "guides";
  const isOnCommunity = platformSection === "community";
  const isOnMoments = platformSection === "moments";

  return (
    <div
      className={`prayer-platform ${isPlaying ? "is-playing" : ""}`}
      style={{ padding: "2rem 1rem 2rem", ...paletteStyle, ...platformStyle }}
    >
      <ActiveRoomsProvider groupId={group?.id ?? null}>
      {/* Top navigation: main tabs + Host/Admin dropdown */}
      <nav
        className="prayer-top-nav"
        aria-label="Main navigation"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "0.25rem",
          marginBottom: "1rem",
          padding: "0.5rem 0",
          borderBottom: "1px solid var(--prayer-card-border, rgba(148,163,184,0.08))",
        }}
      >
        <Link
          href={prayerBase}
          className={`prayer-top-nav-item ${isOnMain ? "active" : ""}`}
          scroll={false}
          style={{
            padding: "0.5rem 0.75rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: isOnMain ? "var(--prayer-accent)" : "var(--prayer-text-muted)",
            textDecoration: "none",
            borderRadius: 8,
          }}
        >
          Pray
        </Link>
        <Link
          href={`${prayerBase}/live`}
          className={`prayer-top-nav-item ${isOnLive ? "active" : ""}`}
          scroll={false}
          style={{
            padding: "0.5rem 0.75rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: isOnLive ? "var(--prayer-accent)" : "var(--prayer-text-muted)",
            textDecoration: "none",
            borderRadius: 8,
          }}
        >
          Live Study
        </Link>
        <Link
          href={`${prayerBase}/guides`}
          className={`prayer-top-nav-item ${isOnGuided ? "active" : ""}`}
          scroll={false}
          style={{
            padding: "0.5rem 0.75rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: isOnGuided ? "var(--prayer-accent)" : "var(--prayer-text-muted)",
            textDecoration: "none",
            borderRadius: 8,
          }}
        >
          Guided
        </Link>
        <Link
          href={`${prayerBase}/community`}
          className={`prayer-top-nav-item ${isOnCommunity ? "active" : ""}`}
          style={{
            padding: "0.5rem 0.75rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: isOnCommunity ? "var(--prayer-accent)" : "var(--prayer-text-muted)",
            textDecoration: "none",
            borderRadius: 8,
          }}
        >
          Community
        </Link>
        <Link
          href={`${prayerBase}/moments`}
          className={`prayer-top-nav-item ${isOnMoments ? "active" : ""}`}
          scroll={false}
          style={{
            padding: "0.5rem 0.75rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: isOnMoments ? "var(--prayer-accent)" : "var(--prayer-text-muted)",
            textDecoration: "none",
            borderRadius: 8,
          }}
        >
          Moments
        </Link>
        <div style={{ position: "relative", marginLeft: "auto" }}>
          <button
            type="button"
            onClick={() => setAdminDropdownOpen((o) => !o)}
            aria-expanded={adminDropdownOpen}
            aria-haspopup="true"
            aria-label="Host and Admin options"
            style={{
              padding: "0.5rem 0.75rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--prayer-text-muted)",
              background: "transparent",
              border: "1px solid var(--prayer-card-border)",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Host / Admin
          </button>
          {adminDropdownOpen && (
            <>
              <div
                role="presentation"
                style={{ position: "fixed", inset: 0, zIndex: 99 }}
                onClick={() => setAdminDropdownOpen(false)}
              />
              <div
                role="menu"
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "0.25rem",
                  minWidth: 180,
                  padding: "0.5rem",
                  background: "var(--prayer-card-bg, rgba(24,22,36,0.72))",
                  border: "1px solid var(--prayer-card-border)",
                  borderRadius: 12,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                  zIndex: 100,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                }}
              >
                <Link
                  href={`${prayerBase}/admin/groups`}
                  role="menuitem"
                  onClick={() => setAdminDropdownOpen(false)}
                  style={{
                    padding: "0.5rem 0.75rem",
                    fontSize: "0.875rem",
                    color: "var(--prayer-text)",
                    textDecoration: "none",
                    borderRadius: 8,
                  }}
                >
                  Groups
                </Link>
                <Link
                  href={`${prayerBase}/admin`}
                  role="menuitem"
                  onClick={() => setAdminDropdownOpen(false)}
                  style={{
                    padding: "0.5rem 0.75rem",
                    fontSize: "0.875rem",
                    color: "var(--prayer-text)",
                    textDecoration: "none",
                    borderRadius: 8,
                  }}
                >
                  Upload Prayer
                </Link>
                <Link
                  href={`${prayerBase}/admin`}
                  role="menuitem"
                  onClick={() => setAdminDropdownOpen(false)}
                  style={{
                    padding: "0.5rem 0.75rem",
                    fontSize: "0.875rem",
                    color: "var(--prayer-text)",
                    textDecoration: "none",
                    borderRadius: 8,
                  }}
                >
                  Create Guided Prayer
                </Link>
                <Link
                  href={`${prayerBase}/live`}
                  role="menuitem"
                  onClick={() => setAdminDropdownOpen(false)}
                  style={{
                    padding: "0.5rem 0.75rem",
                    fontSize: "0.875rem",
                    color: "var(--prayer-text)",
                    textDecoration: "none",
                    borderRadius: 8,
                  }}
                >
                  Room Host Controls
                </Link>
              </div>
            </>
          )}
        </div>
      </nav>

      <section className="prayer-hero-card">
        {group && (
          <div className="prayer-group-brand">
            {group.logo ? (
              <img
                src={getGroupLogoUrl(group.id)}
                alt=""
                className="prayer-group-logo"
              />
            ) : null}
            <span className="prayer-brand">{group.name}</span>
          </div>
        )}
        {!group && <div className="prayer-brand">Prayer</div>}

        {platformSection ? (
          <>
            <h1 className="prayer-title">
              {platformSection === "live"
                ? "Live Prayer Rooms"
                : platformSection === "moments"
                  ? "Prayer Moments"
                  : platformSection === "guides"
                    ? "Guided Prayer"
                    : "Community Prayer"}
            </h1>
            <p className="prayer-subtitle">
              {platformSection === "live"
                ? "Join or host live audio prayer rooms."
                : platformSection === "moments"
                  ? "Short prayers from the community."
                  : platformSection === "guides"
                    ? "Structured prayer with scripture and focus points."
                    : "Prayer chains and group prayer."}
            </p>
            {platformSection === "live" && <LiveSection prayerBase={prayerBase} groupSlug={group?.slug ?? groupSlug} groupId={group?.id ?? null} isAdmin={isAdmin} />}
            {platformSection === "moments" && <MomentsSection prayerBase={prayerBase} groupSlug={group?.slug ?? groupSlug} groupId={group?.id ?? null} />}
            {platformSection === "guides" && <GuidedSection prayerBase={prayerBase} groupSlug={group?.slug ?? groupSlug} />}
            {platformSection === "community" && <CommunitySection prayerBase={prayerBase} groupSlug={group?.slug ?? groupSlug} />}
          </>
        ) : (
          <>
            {/* Header: title, subtitle, live status, primary actions */}
            <header className="prayer-header">
              <h1 className="prayer-title">{current?.title ?? (group ? "Prayer" : "Daily Prayer")}</h1>
              <p className="prayer-subtitle">
                {current?.description ||
                  (current ? "Listen below." : group?.description || "No prayer available yet.")}
              </p>
              {(liveCount > 0 || presenceTotal > 0) && (
                <p className="prayer-live-status">
                  {liveCount > 0 && `${liveCount} listening now`}
                  {liveCount > 0 && presenceTotal > 0 && " · "}
                  {presenceTotal > 0 && `${presenceTotal} praying now`}
                </p>
              )}
              <div className="prayer-header-actions">
                <Link
                  href={group ? `${prayerBase}/${group.slug}/live` : `${prayerBase}/live`}
                  className="prayer-cta-btn prayer-cta-primary"
                >
                  Join Live
                </Link>
                <Link
                  href={group ? `${prayerBase}/${group.slug}/live` : `${prayerBase}/live`}
                  className="prayer-cta-btn prayer-cta-secondary"
                  style={{ textDecoration: "none" }}
                >
                  Start meeting
                </Link>
                <Link
                  href={group ? `${prayerBase}/${group.slug}/live` : `${prayerBase}/live`}
                  className="prayer-cta-btn prayer-cta-secondary"
                  style={{ textDecoration: "none" }}
                >
                  Start Group Prayer
                </Link>
              </div>
              <p className="prayer-header-identity" style={{ marginTop: "0.5rem", fontSize: "0.8125rem", color: "var(--prayer-text-muted)" }}>
                {session?.user ? (
                  <>Signed in as {session.user.name ?? session.user.email ?? "User"}</>
                ) : (
                  <Link href="/api/auth/signin?callbackUrl=%2Fprayer" className="prayer-share-link">Sign in</Link>
                )}
              </p>
            </header>

            {/* Core module: Player or Recorder only */}
            <div id="player" className="prayer-core-module">
              {mode === "player" && (
                <PlayerModule
                  src={audioSrc}
                  title={current?.title}
                  onPlayingChange={handlePlayingChange}
                  onDurationChange={setDurationSeconds}
                  seekToSeconds={seekToSec}
                  onSeekDone={() => setSeekToSec(null)}
                  replayPrayer={current?.source === "live_room" ? current : null}
                  durationSec={durationSeconds || current?.duration || 0}
                  onReplaySeek={(timestampSec) => setSeekToSec(timestampSec)}
                />
              )}
              {mode === "record" && (
                <RecorderModule
                  groupId={group?.id ?? null}
                  onPublished={(prayer) => {
                    setAllPrayers((prev) => [prayer, ...prev]);
                    setCurrent(prayer);
                    loadPrayers();
                    setMode("player");
                    setEditingDraftId(null);
                  }}
                  onCancel={() => {
                    setMode("player");
                    setEditingDraftId(null);
                  }}
                  initialDraftId={editingDraftId}
                  onOpenSnapshots={() => setSnapshotsOpen(true)}
                />
              )}
            <SnapshotsPanel
              isOpen={snapshotsOpen}
              onClose={() => setSnapshotsOpen(false)}
              onEditDraft={(id) => {
                setEditingDraftId(id);
                setSnapshotsOpen(false);
                setMode("record");
              }}
            />
            </div>

            {/* Context tools: collapsed by default */}
            <div className="prayer-context-tools">
              <button
                type="button"
                className="prayer-context-tools-toggle"
                onClick={() => setContextToolsOpen((o) => !o)}
                aria-expanded={contextToolsOpen}
              >
                {contextToolsOpen ? "Hide" : "More"} — Share, Past Prayers, Moments, Guided, Community
              </button>
              {contextToolsOpen && (
                <div className="prayer-context-tools-content">
                  <div className="prayer-metrics-row">
                    <div className="prayer-metrics-item">
                      <span className="prayer-metrics-label">Total listeners</span>
                      <span className="prayer-metrics-value">{totalListeners.toLocaleString()}</span>
                    </div>
                    <div className="prayer-metrics-item">
                      <span className="prayer-metrics-label">{group ? "Praying now" : "Listening now"}</span>
                      <span className="prayer-metrics-value">
                        {liveCount === 0 ? "—" : `${liveCount} people`}
                      </span>
                    </div>
                    <div className="prayer-metrics-item">
                      <span className="prayer-metrics-label">Prayer length</span>
                      <span className="prayer-metrics-value">{formatDuration(durationSeconds)}</span>
                    </div>
                  </div>
                  {current && (
                    <PrayerShare url={shareUrl} title={current.title} text={current.description} />
                  )}
                  <PrayerLibrary
                    prayers={allPrayers}
                    currentId={current?.id ?? null}
                    onSelect={setCurrent}
                    secondary
                  />
                  <div className="prayer-context-links">
                    <Link href={sectionPath("live")}>Live rooms / Start meeting</Link>
                    <Link href={sectionPath("moments")}>Moments</Link>
                    <Link href={sectionPath("guides")}>Guided</Link>
                    <Link href={sectionPath("community")}>Community</Link>
                    <button
                      type="button"
                      onClick={() => setSnapshotsOpen(true)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        font: "inherit",
                        color: "var(--prayer-accent)",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      My snapshots
                    </button>
                    <Link href={`${prayerBase}/admin`}>Admin</Link>
                    <Link href={`${prayerBase}/admin/groups`}>Groups</Link>
                  </div>
                  <LivePrayerCta prayerBase={prayerBase} groupId={group?.id} isAdmin={isAdmin} />
                  <PrayerTimerSelector prayerBase={prayerBase} onStartPrayer={() => setMode("record")} />
                  {current?.prayerText && (
                    <div className="prayer-text-section">
                      <button
                        type="button"
                        className="prayer-text-toggle"
                        onClick={() => setPrayerTextOpen((o) => !o)}
                        aria-expanded={prayerTextOpen}
                      >
                        Prayer Text
                        <span className="prayer-text-toggle-icon" aria-hidden>{prayerTextOpen ? "−" : "+"}</span>
                      </button>
                      {prayerTextOpen && (
                        <div className="prayer-text-block">{current.prayerText}</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Group selector in header area */}
            {groups.length > 0 && (
              <div className="prayer-group-selector-wrap">
                <label htmlFor="prayer-group-select" className="prayer-metrics-label">
                  My Groups
                </label>
                <select
                  id="prayer-group-select"
                  className="prayer-group-select"
                  value={group?.slug ?? ""}
                  onChange={handleGroupChange}
                  aria-label="Select group"
                >
                  <option value="">All</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.slug}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}
      </section>

      {/* Bottom navigation bar */}
      <nav className="prayer-bottom-nav" aria-label="Prayer platform areas">
        <Link href={navPrayerHref} className={`prayer-bottom-nav-item ${!platformSection ? "active" : ""}`} scroll={false}>
          Prayer
        </Link>
        <Link href={sectionPath("live")} className={`prayer-bottom-nav-item ${platformSection === "live" ? "active" : ""}`} scroll={false}>
          Live
        </Link>
        <Link href={sectionPath("moments")} className={`prayer-bottom-nav-item ${platformSection === "moments" ? "active" : ""}`} scroll={false}>
          Moments
        </Link>
        <Link href={sectionPath("guides")} className={`prayer-bottom-nav-item ${platformSection === "guides" ? "active" : ""}`} scroll={false}>
          Guided
        </Link>
        <Link href={sectionPath("community")} className={`prayer-bottom-nav-item ${platformSection === "community" ? "active" : ""}`} scroll={false}>
          Community
        </Link>
      </nav>

      <div className="prayer-footer-links">
        <PrayerAuthControls prayerBase={prayerBase} />
        <div className="prayer-palette-switcher">
          <label htmlFor="prayer-palette-select" className="prayer-metrics-label">Theme</label>
          <select
            id="prayer-palette-select"
            className="prayer-group-select"
            value={paletteId}
            onChange={(e) => setPaletteId(e.target.value as PaletteId)}
            aria-label="Select theme"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="church">Church / Warm</option>
          </select>
        </div>
        <span>
          <Link href={`${prayerBase}/admin`} className="prayer-admin-link" aria-label="Admin">Admin</Link>
          {" · "}
          <Link href={`${prayerBase}/admin/groups`} className="prayer-admin-link" aria-label="Groups">Groups</Link>
        </span>
      </div>
      </ActiveRoomsProvider>
    </div>
  );
}

/**
 * Main experience: player-first. Latest prayer autoloads. Prayer Text expandable; Past Prayers secondary.
 * Wraps in SessionProvider so useSession works when rendered from /dev or any route without a parent provider.
 */
export function PrayerApp(props: PrayerAppProps) {
  return (
    <SessionProvider refetchInterval={0}>
      <PrayerAppInner {...props} />
    </SessionProvider>
  );
}

export default PrayerApp;
