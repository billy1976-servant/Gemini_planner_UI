"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PrayerShare } from "./PrayerShare";
import { PrayerLibrary } from "./PrayerLibrary";
import { PrayerUpload } from "./PrayerUpload";
import { GroupAdmin } from "./GroupAdmin";
import { PrayerRoom } from "./PrayerRoom";
import { LivePrayerCta } from "./LivePrayerCta";
import { LiveSection } from "./live/LiveSection";
import { MomentsSection } from "./moments/MomentsSection";
import { GuidedSection } from "./guided/GuidedSection";
import { CommunitySection } from "./community/CommunitySection";
import { GuidedPrayerCreate } from "./guided/GuidedPrayerCreate";
import { PrayerAuthControls } from "./PrayerAuthControls";
import { PrayerTimerSelector } from "./PrayerTimerSelector";
import { PlayerModule } from "../../../components/prayer/PlayerModule";
import { RecorderModule } from "../../../components/prayer/RecorderModule";
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
import { useTheme } from "../../../components/ui/ThemeProvider";
import type { PaletteId } from "@/lib/ui/palette";
import "./prayer-theme.css";

const PLATFORM_SECTIONS = ["live", "moments", "guides", "community"] as const;
type PlatformSection = (typeof PLATFORM_SECTIONS)[number];

export type PrayerMode = "player" | "record" | "live";

function isPlatformSection(s: string): s is PlatformSection {
  return PLATFORM_SECTIONS.includes(s as PlatformSection);
}

const HEARTBEAT_INTERVAL_MS = 20_000;
const LIVE_POLL_INTERVAL_MS = 20_000;

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export interface PrayerAppProps {
  slug?: string[];
  baseUrl?: string;
  showAdmin?: boolean;
}

function getAudioUrl(audioUrl: string): string {
  if (audioUrl.startsWith("http") || audioUrl.startsWith("/")) return audioUrl;
  return `/api/prayer/audio?path=${encodeURIComponent(audioUrl)}`;
}

/**
 * Main experience: player-first. Latest prayer autoloads. Prayer Text expandable; Past Prayers secondary.
 */
export function PrayerApp({ slug = [], baseUrl, showAdmin: showAdminProp }: PrayerAppProps) {
  const router = useRouter();
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
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    getGroups().then(setGroups);
  }, []);

  const isAdmin = showAdminProp || slug?.[0] === "admin";
  const isGroupAdmin = slug?.[0] === "admin" && slug?.[1] === "groups";
  const isRoom = slug?.[0] === "room" && slug?.[1];

  // Platform section (live | moments | guides | community) and group-aware slug
  let platformSection: PlatformSection | null = null;
  let groupSlug: string | null = null;
  let prayerSlug: string | null = null;
  let idFromSlug: string | null = null;

  if (slug?.[0] === "admin") {
    groupSlug = null;
    prayerSlug = null;
    idFromSlug = null;
  } else if (slug?.[0] && isPlatformSection(slug[0])) {
    platformSection = slug[0] as PlatformSection;
    groupSlug = null;
    prayerSlug = null;
    idFromSlug = null;
  } else if (slug?.[1] && isPlatformSection(slug[1])) {
    platformSection = slug[1] as PlatformSection;
    groupSlug = slug[0] ?? null;
    prayerSlug = null;
    idFromSlug = null;
  } else {
    platformSection = null;
    groupSlug =
      slug?.[0] && slug[0] !== "admin" && slug[0] !== "room" ? slug[0] : null;
    prayerSlug = groupSlug && slug?.[1] ? slug[1] : null;
    idFromSlug =
      !groupSlug && slug?.[0] && slug[0] !== "today" && slug[0] !== "admin" && slug[0] !== "room" && !isPlatformSection(slug[0])
        ? slug[0]
        : null;
  }

  useEffect(() => {
    if (groupSlug) {
      setGroupLoading(true);
      getGroupBySlug(groupSlug).then((g) => {
        setGroup(g ?? null);
        setGroupLoading(false);
      });
    } else {
      setGroup(null);
      setGroupLoading(false);
    }
  }, [groupSlug]);

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

  const shareUrl =
    baseUrl ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/prayer${group ? `/${group.slug}` : ""}${current?.id ? `/${current.id}` : ""}`
      : "");
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

  if (isRoom) {
    return <PrayerRoom roomId={slug![1]} />;
  }

  if (isGroupAdmin) {
    return (
      <div className="prayer-platform" style={{ padding: "2rem 1rem 4rem" }}>
        <div style={{ maxWidth: 420, margin: "0 auto 1.5rem", textAlign: "center" }}>
          <Link href="/prayer/admin" className="prayer-share-link" style={{ fontSize: "0.875rem" }}>
            ← Prayer admin
          </Link>
        </div>
        <GroupAdmin />
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="prayer-platform" style={{ padding: "2rem 1rem 4rem" }}>
        <div style={{ maxWidth: 420, margin: "0 auto 1.5rem", textAlign: "center" }}>
          <Link href="/prayer" className="prayer-share-link" style={{ fontSize: "0.875rem" }}>
            ← Back to prayer
          </Link>
          {" · "}
          <Link href="/prayer/admin/groups" className="prayer-share-link" style={{ fontSize: "0.875rem" }}>
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
            <Link href="/prayer" className="prayer-share-link">← Back to prayer</Link>
          </div>
        </section>
      </div>
    );
  }

  const basePath = group ? `/prayer/${group.slug}` : "/prayer";
  const sectionPath = (section: PlatformSection) => (group ? `${basePath}/${section}` : `/prayer/${section}`);

  const handleGroupChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (platformSection) {
        const path = value ? `/prayer/${value}/${platformSection}` : `/prayer/${platformSection}`;
        router.push(path);
      } else {
        const path = value ? `/prayer/${value}` : "/prayer";
        router.push(path);
      }
    },
    [platformSection, router]
  );

  return (
    <div
      className={`prayer-platform ${isPlaying ? "is-playing" : ""}`}
      style={{ padding: "2rem 1rem 2rem", ...paletteStyle, ...platformStyle }}
    >
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
            {platformSection === "live" && <LiveSection groupSlug={group?.slug ?? groupSlug} groupId={group?.id ?? null} isAdmin={isAdmin} />}
            {platformSection === "moments" && <MomentsSection groupSlug={group?.slug ?? groupSlug} groupId={group?.id ?? null} />}
            {platformSection === "guides" && <GuidedSection groupSlug={group?.slug ?? groupSlug} />}
            {platformSection === "community" && <CommunitySection groupSlug={group?.slug ?? groupSlug} />}
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
                  href={group ? `/prayer/${group.slug}/live` : "/prayer/live"}
                  className="prayer-cta-btn prayer-cta-primary"
                >
                  Join Live
                </Link>
                <button
                  type="button"
                  className="prayer-cta-btn prayer-cta-secondary"
                  onClick={() => setMode("record")}
                >
                  Start Prayer
                </button>
              </div>
              <p className="prayer-header-identity" style={{ marginTop: "0.5rem", fontSize: "0.8125rem", color: "var(--prayer-text-muted)" }}>
                {session?.user ? (
                  <>Signed in as {session.user.name ?? session.user.email ?? "User"}</>
                ) : (
                  <Link href="/api/auth/signin" className="prayer-share-link">Sign in</Link>
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
                  }}
                  onCancel={() => setMode("player")}
                />
              )}
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
                    <Link href={sectionPath("moments")}>Moments</Link>
                    <Link href={sectionPath("guides")}>Guided</Link>
                    <Link href={sectionPath("community")}>Community</Link>
                    <Link href="/prayer/admin">Admin</Link>
                    <Link href="/prayer/admin/groups">Groups</Link>
                  </div>
                  <LivePrayerCta groupId={group?.id} isAdmin={isAdmin} />
                  <PrayerTimerSelector onStartPrayer={() => setMode("record")} />
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
        <Link
          href={basePath}
          className={`prayer-bottom-nav-item ${!platformSection ? "active" : ""}`}
        >
          Prayer
        </Link>
        <Link
          href={sectionPath("live")}
          className={`prayer-bottom-nav-item ${platformSection === "live" ? "active" : ""}`}
        >
          Live
        </Link>
        <Link
          href={sectionPath("moments")}
          className={`prayer-bottom-nav-item ${platformSection === "moments" ? "active" : ""}`}
        >
          Moments
        </Link>
        <Link
          href={sectionPath("guides")}
          className={`prayer-bottom-nav-item ${platformSection === "guides" ? "active" : ""}`}
        >
          Guided
        </Link>
        <Link
          href={sectionPath("community")}
          className={`prayer-bottom-nav-item ${platformSection === "community" ? "active" : ""}`}
        >
          Community
        </Link>
      </nav>

      <div className="prayer-footer-links">
        <PrayerAuthControls />
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
          <Link href="/prayer/admin" className="prayer-admin-link" aria-label="Admin">Admin</Link>
          {" · "}
          <Link href="/prayer/admin/groups" className="prayer-admin-link" aria-label="Groups">Groups</Link>
        </span>
      </div>
    </div>
  );
}
