"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  getGroups,
  createGroup,
  updateGroup,
  uploadGroupLogo,
  getGroupLogoUrl,
  getMyGroupIds,
  joinGroup,
  leaveGroup,
} from "./api/prayer-api";
import { PrayerUpload } from "./PrayerUpload";
import type { Group } from "./prayertypes";

export interface GroupAdminProps {
  prayerBase?: string;
}

export function GroupAdmin({ prayerBase = "/prayer" }: GroupAdminProps = {}) {
  const { data: session } = useSession();
  const [groups, setGroups] = useState<Group[]>([]);
  const [memberGroupIds, setMemberGroupIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createAccent, setCreateAccent] = useState("#7c3aed");
  const [creating, setCreating] = useState(false);
  const [joinLeaveLoading, setJoinLeaveLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(() => {
    return Promise.all([getGroups(), getMyGroupIds()]).then(([groupsList, ids]) => {
      setGroups(groupsList);
      setMemberGroupIds(new Set(ids));
    });
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    setError(null);
    setCreating(true);
    try {
      const created = await createGroup({
        name: createName.trim(),
        description: createDescription.trim() || undefined,
        accentColor: createAccent,
        createdBy: session?.user?.email ?? undefined,
      });
      if (created) {
        setCreateName("");
        setCreateDescription("");
        setCreateAccent("#7c3aed");
        load();
      } else {
        setError("Create failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreating(false);
    }
  };

  const handleLogoUpload = async (groupId: string, file: File) => {
    try {
      const result = await uploadGroupLogo(groupId, file);
      if (result) load();
      else setError("Logo upload failed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logo upload failed");
    }
  };

  const handleAccentChange = async (group: Group, accentColor: string) => {
    try {
      await updateGroup(group.id, { accentColor });
      load();
    } catch {
      // ignore
    }
  };

  const handleJoin = async (groupId: string) => {
    setJoinLeaveLoading(groupId);
    setError(null);
    try {
      await joinGroup(groupId);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Join failed");
    } finally {
      setJoinLeaveLoading(null);
    }
  };

  const handleLeave = async (groupId: string) => {
    setJoinLeaveLoading(groupId);
    setError(null);
    try {
      await leaveGroup(groupId);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Leave failed");
    } finally {
      setJoinLeaveLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="prayer-card" style={{ maxWidth: 420, margin: "0 auto" }}>
        <p className="prayer-subtitle">Loading groupsΓÇª</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <div className="prayer-card" style={{ marginBottom: "1.5rem" }}>
        <h2 className="prayer-title" style={{ marginBottom: "1rem" }}>
          Create group
        </h2>
        <form onSubmit={handleCreate} className="prayer-upload-form">
          <label htmlFor="group-name">Name *</label>
          <input
            id="group-name"
            type="text"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            placeholder="e.g. Calvary Knoxville"
            required
          />
          <label htmlFor="group-desc">Description</label>
          <input
            id="group-desc"
            type="text"
            value={createDescription}
            onChange={(e) => setCreateDescription(e.target.value)}
            placeholder="Short description"
          />
          <label htmlFor="group-accent">Accent color</label>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <input
              id="group-accent"
              type="color"
              value={createAccent}
              onChange={(e) => setCreateAccent(e.target.value)}
              style={{ width: 48, height: 32, padding: 0, border: "1px solid var(--prayer-card-border)", borderRadius: 8 }}
            />
            <input
              type="text"
              value={createAccent}
              onChange={(e) => setCreateAccent(e.target.value)}
              style={{ flex: 1, fontFamily: "monospace" }}
            />
          </div>
          {error && (
            <p style={{ color: "#f87171", fontSize: "0.875rem", marginBottom: "0.75rem" }}>{error}</p>
          )}
          <button type="submit" disabled={creating}>
            {creating ? "CreatingΓÇª" : "Create group"}
          </button>
        </form>
      </div>

      <h2 className="prayer-title" style={{ marginBottom: "0.75rem", fontSize: "1.125rem" }}>
        Groups
      </h2>
      <ul className="prayer-more-list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {groups.map((g) => (
          <li key={g.id} className="prayer-card" style={{ marginBottom: "1rem", padding: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              {g.logo ? (
                <img
                  src={getGroupLogoUrl(g.id)}
                  alt=""
                  style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    background: g.accentColor || "#7c3aed",
                    opacity: 0.6,
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "var(--prayer-text)" }}>{g.name}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--prayer-text-subtle)" }}>
                  /prayer/{g.slug}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                {memberGroupIds.has(g.id) ? (
                  <button
                    type="button"
                    onClick={() => handleLeave(g.id)}
                    disabled={joinLeaveLoading === g.id}
                    style={{ padding: "0.35rem 0.6rem", borderRadius: 8, border: "1px solid var(--prayer-card-border)", background: "transparent", color: "var(--prayer-text)", cursor: "pointer", fontSize: "0.8125rem" }}
                  >
                    {joinLeaveLoading === g.id ? "ΓÇª" : "Leave"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleJoin(g.id)}
                    disabled={joinLeaveLoading === g.id}
                    style={{ padding: "0.35rem 0.6rem", borderRadius: 8, border: "1px solid var(--prayer-play-bg)", background: "var(--prayer-play-bg)", color: "#fff", cursor: "pointer", fontSize: "0.8125rem" }}
                  >
                    {joinLeaveLoading === g.id ? "ΓÇª" : "Join"}
                  </button>
                )}
                <Link
                  href={`${prayerBase}/${g.slug}`}
                  className="prayer-share-link"
                  style={{ fontSize: "0.8125rem" }}
                >
                  View ΓåÆ
                </Link>
              </div>
            </div>
            <div style={{ marginTop: "0.75rem", display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
              <label style={{ fontSize: "0.75rem", color: "var(--prayer-text-muted)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                Logo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleLogoUpload(g.id, f);
                    e.target.value = "";
                  }}
                  style={{ fontSize: "0.75rem" }}
                />
              </label>
              <label style={{ fontSize: "0.75rem", color: "var(--prayer-text-muted)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                Accent
                <input
                  type="color"
                  value={g.accentColor || "#7c3aed"}
                  onChange={(e) => handleAccentChange(g, e.target.value)}
                  style={{ width: 28, height: 24, padding: 0, border: "1px solid var(--prayer-card-border)", borderRadius: 4 }}
                />
              </label>
              <button
                type="button"
                className="prayer-speed-cycle-btn"
                style={{ marginLeft: 0 }}
                onClick={() => setExpandedId(expandedId === g.id ? null : g.id)}
              >
                {expandedId === g.id ? "Hide upload" : "Upload prayer"}
              </button>
            </div>
            {expandedId === g.id && (
              <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--prayer-card-border)" }}>
                <PrayerUpload
                  groupId={g.id}
                  onUploaded={() => {
                    setExpandedId(null);
                  }}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
      {groups.length === 0 && (
        <p className="prayer-subtitle" style={{ marginTop: "0.5rem" }}>
          No groups yet. Create one above.
        </p>
      )}
    </div>
  );
}
