"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const GOOGLE = {
  primary: "#1a73e8",
  primaryHover: "#1765cc",
  surface: "#ffffff",
  surfaceHover: "#f1f3f4",
  border: "#dadce0",
  textPrimary: "#202124",
  textSecondary: "#5f6368",
  error: "#d93025",
  fontFamily: "'Google Sans', 'Roboto', system-ui, sans-serif",
  radius: 8,
};

type TemplateEntry = { value: string; label: string };

const FALLBACK_APP_TEMPLATES: TemplateEntry[] = [
  { value: "journal_track", label: "journal_track" },
];

export default function CreateNewInterfacePanel() {
  const router = useRouter();
  const [template, setTemplate] = useState("journal_track");
  const [appName, setAppName] = useState("");
  const [appTemplates, setAppTemplates] = useState<TemplateEntry[]>(FALLBACK_APP_TEMPLATES);
  const [moduleTemplates, setModuleTemplates] = useState<TemplateEntry[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/app-templates")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.templates) && data.templates.length > 0) {
          setAppTemplates(data.templates);
          setTemplate((prev) => {
            const exists = data.templates.some((t: TemplateEntry) => t.value === prev);
            return exists ? prev : data.templates[0].value;
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/module-templates")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.templates)) setModuleTemplates(data.templates);
      })
      .catch(() => {});
  }, []);

  const slug = appName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "my-interface";

  const isModuleTemplate = template.includes("_") && moduleTemplates.some((t) => t.value === template);

  const handleDuplicateAndCompile = async () => {
    setStatus("loading");
    setMessage("");
    try {
      if (isModuleTemplate) {
        // Create from 08_Modules: copy master blueprint + subtype content to generated/<slug>, then compile
        const createRes = await fetch("/api/create-from-module", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moduleTemplate: template,
            slug,
          }),
        });
        const createData = await createRes.json().catch(() => ({}));
        if (!createRes.ok) {
          setStatus("error");
          setMessage(createData.error || createRes.statusText);
          return;
        }
        // create-from-module now compiles; redirect only on success (app.json exists)
        setStatus("ok");
        setMessage("Created. Opening…");
        const screenPath = `generated/${slug}/app`;
        router.replace(`/?screen=${encodeURIComponent(screenPath)}`);
        return;
      }

      // Existing flow: duplicate app folder then compile
      const duplicateRes = await fetch("/api/duplicate-app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateAppPath: template,
          newAppPath: slug,
        }),
      });
      const dupData = await duplicateRes.json().catch(() => ({}));
      if (!duplicateRes.ok) {
        setStatus("error");
        setMessage(dupData.error || duplicateRes.statusText);
        return;
      }

      const compileRes = await fetch("/api/compile-app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "compile",
          appPath: slug,
        }),
      });
      const compileData = await compileRes.json().catch(() => ({}));
      if (!compileRes.ok) {
        setStatus("error");
        setMessage(compileData.error || compileRes.statusText);
        return;
      }

      setStatus("ok");
      setMessage("Created. Opening…");
      const screenPath = `apps/${slug}/app`;
      router.replace(`/?screen=${encodeURIComponent(screenPath)}`);
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Request failed");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontFamily: GOOGLE.fontFamily }}>
      <div>
        <label style={{ display: "block", fontSize: 12, color: GOOGLE.textSecondary, marginBottom: "4px", fontWeight: 500 }}>
          Template app
        </label>
        <select
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: GOOGLE.radius,
            border: `1px solid ${GOOGLE.border}`,
            fontSize: 14,
            color: GOOGLE.textPrimary,
            background: GOOGLE.surface,
          }}
        >
          <optgroup label="App templates">
            {appTemplates.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </optgroup>
          {moduleTemplates.length > 0 && (
            <optgroup label="Module templates (08_Modules)">
              {moduleTemplates.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>
      <div>
        <label style={{ display: "block", fontSize: 12, color: GOOGLE.textSecondary, marginBottom: "4px", fontWeight: 500 }}>
          New app name
        </label>
        <input
          type="text"
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          placeholder="e.g. My Study Journal"
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: GOOGLE.radius,
            border: `1px solid ${GOOGLE.border}`,
            fontSize: 14,
            color: GOOGLE.textPrimary,
            background: GOOGLE.surface,
            boxSizing: "border-box",
          }}
        />
        {slug && (
          <div style={{ fontSize: 11, color: GOOGLE.textSecondary, marginTop: "4px" }}>
            Folder: {isModuleTemplate ? `generated/${slug}` : `apps/${slug}`}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={handleDuplicateAndCompile}
        disabled={status === "loading"}
        style={{
          marginTop: "8px",
          padding: "10px 16px",
          borderRadius: GOOGLE.radius,
          border: "none",
          background: GOOGLE.primary,
          color: "#fff",
          fontSize: 14,
          fontWeight: 500,
          cursor: status === "loading" ? "wait" : "pointer",
        }}
      >
        {status === "loading" ? "Creating…" : "Duplicate template & open"}
      </button>
      {message && (
        <div
          style={{
            fontSize: 13,
            color: status === "error" ? GOOGLE.error : GOOGLE.textSecondary,
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}
