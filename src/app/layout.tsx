"use client";
// CONTRACT:
// Palette = visual only
// Layout = structural only
// Palette must never mutate layout config, dropdowns, or layout persistence.
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";

import "@/styles/site-theme.css";
import InteractionTracerPanel from "@/devtools/InteractionTracerPanel";

/* ============================================================
   🎨 PALETTE ENGINE (state is source of truth; palette-store used only as fallback)
============================================================ */
import { getPaletteName } from "@/engine/core/palette-store";
import { usePaletteCSS } from "@/lib/site-renderer/palette-bridge";


/* ============================================================
   🧱 LAYOUT ENGINE (state is source of truth; layout-store used only as fallback)
============================================================ */
import { getLayout, subscribeLayout, type LayoutMode } from "@/engine/core/layout-store";
import { getCurrentScreenTree } from "@/engine/core/current-screen-tree-store";
import { buildTemplateFromTree, serializeTemplateProfile } from "@/lib/layout/save-current-as-template";


/* ============================================================
   📐 TEMPLATE PROFILES (layout + preset override)
============================================================ */
import { getTemplateList } from "@/lib/layout/template-profiles";

/* ============================================================
   🧠 STATE (PHASE B: INTERNAL VIEW NAV)
============================================================ */
import { dispatchState, getState, subscribeState } from "@/state/state-store";


/* ============================================================
   🧠 BEHAVIOR LISTENER
============================================================ */
import { installBehaviorListener } from "@/engine/core/behavior-listener";


/* ============================================================
   📐 EXPERIENCE PROFILES (single JSON authority)
============================================================ */
import presentationProfiles from "@/lib/layout/presentation-profiles.json";


/* ============================================================
   🔒 STATIC REGISTRIES
============================================================ */
const PALETTES = [
  "default",
  "premium",
  "crazy",
  "dark",
  "kids",
  "playful",
  "elderly",
  "french",
  "spanish",
];


const EXPERIENCES: Record<string, any> = {
  website: (presentationProfiles as Record<string, any>).website,
  app: (presentationProfiles as Record<string, any>).app,
  learning: (presentationProfiles as Record<string, any>).learning,
};


type ScreensIndex = {
  category: string;
  directFiles?: string[];
  folders: Record<string, string[]>;
};


export default function RootLayout({ children }: any) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [index, setIndex] = useState<ScreensIndex[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("");
  const [selectedFile, setSelectedFile] = useState("");


  const stateSnapshot = useSyncExternalStore(subscribeState, getState, getState);
  const layoutSnapshot = useSyncExternalStore(subscribeLayout, getLayout, getLayout);
  const templateList = getTemplateList();

  // State is source of truth; fall back to layout-store / palette-store when key is missing
  const experience = (stateSnapshot?.values?.experience ?? (layoutSnapshot as { experience?: string })?.experience) ?? "website";
  const templateId = (stateSnapshot?.values?.templateId ?? (layoutSnapshot as { templateId?: string })?.templateId) ?? "";
  const layoutMode = (stateSnapshot?.values?.layoutMode ?? (layoutSnapshot as { mode?: LayoutMode })?.mode) ?? "template";
  const paletteName = (stateSnapshot?.values?.paletteName ?? getPaletteName()) || "default";

  const [showSections, setShowSections] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("[MOUNT]", "RootLayout");
    return () => console.log("[UNMOUNT]", "RootLayout");
  }, []);

  /* Apply palette to document root so app-chrome + content both inherit */
  usePaletteCSS();

  /* ============================================================
     🔗 DEMO: INITIAL EXPERIENCE FROM URL (seed state so dropdown reflects it)
  ============================================================ */
  useEffect(() => {
    const exp = searchParams.get("experience");
    if ((exp === "website" || exp === "app" || exp === "learning") && stateSnapshot?.values?.experience !== exp) {
      dispatchState("state:update", { key: "experience", value: exp });
    }
  }, [searchParams, stateSnapshot?.values?.experience]);

  /* ============================================================
     🔁 INSTALL BEHAVIOR ROUTER (ONCE)
     ❗ NO STATE REPLAY HERE
  ============================================================ */
  useEffect(() => {
    installBehaviorListener((to: string) => {
      if (typeof to === "string" && to.startsWith("|")) {
        dispatchState("state:currentView", { value: to });
        return;
      }
      router.replace(`/?screen=${encodeURIComponent(to)}`);
    });
  }, [router]);


  /* ============================================================
     📂 LOAD AVAILABLE SCREENS
  ============================================================ */
  useEffect(() => {
    fetch("/api/screens")
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to load /api/screens (${res.status})`);
        }
        return res.json();
      })
      .then(data => {
        setIndex(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error(err);
        setIndex([]);
      });
  }, []);


  const categoryOptions = index.map(x => x.category);
  const selectedCategoryObj = index.find(x => x.category === selectedCategory);

  const directFiles = selectedCategoryObj?.directFiles ?? [];
  const subfolderNames = Object.keys(selectedCategoryObj?.folders ?? {});

  const level2Options: { name: string; kind: "file" | "folder" }[] = [
    ...directFiles.map(name => ({ name, kind: "file" as const })),
    ...subfolderNames.map(name => ({ name, kind: "folder" as const })),
  ];

  const selectedIsDirectFile =
    selectedCategory &&
    selectedFolder &&
    directFiles.includes(selectedFolder);

  const folderOptions = subfolderNames;
  const fileOptions =
    selectedIsDirectFile || !selectedFolder
      ? []
      : (selectedCategoryObj?.folders?.[selectedFolder] ?? []);

  const navigate = (category: string, folder: string, file?: string) => {
    if (file === undefined) {
      const screenPath = `${category}/${folder}`;
      router.replace(`/?screen=${encodeURIComponent(screenPath)}`);
    } else {
      const screenPath = `${category}/${folder}/${file}`;
      router.replace(`/?screen=${encodeURIComponent(screenPath)}`);
    }
  };

  return (
    <html>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&family=Poppins:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="app-body">
        {/* Navigator: no key — identity stable; palette changes only update CSS, never remount. */}
        <div className="app-chrome">
          <b>HIclarify Navigator</b>

          <select
            value={selectedCategory}
            onChange={e => {
              setSelectedCategory(e.target.value);
              setSelectedFolder("");
              setSelectedFile("");
            }}
          >
            <option value="">Select Category…</option>
            {categoryOptions.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>


          <select
            value={selectedFolder}
            disabled={!selectedCategory}
            onChange={e => {
              const value = e.target.value;
              setSelectedFolder(value);
              setSelectedFile("");
              const option = level2Options.find(o => o.name === value);
              if (option?.kind === "file" && selectedCategory && value) {
                navigate(selectedCategory, value);
              }
            }}
          >
            <option value="">Select file or folder…</option>
            {level2Options.map(o => (
              <option key={o.name} value={o.name}>
                {o.name}{o.kind === "folder" ? " (folder)" : ""}
              </option>
            ))}
          </select>


          <select
            value={selectedFile}
            disabled={!selectedCategory || !selectedFolder || selectedIsDirectFile}
            onChange={e => {
              const file = e.target.value;
              setSelectedFile(file);
              if (selectedCategory && selectedFolder && file && !directFiles.includes(selectedFolder)) {
                navigate(selectedCategory, selectedFolder, file);
              }
            }}
          >
            <option value="">Select file…</option>
            {fileOptions.map(f => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>


          <span className="app-chrome-spacer" aria-hidden="true" />

          <select
            value={experience}
            onChange={e => {
              const value = e.target.value as "website" | "app" | "learning";
              window.dispatchEvent(
                new CustomEvent("action", {
                  detail: {
                    type: "Action",
                    params: { name: "state:update", key: "experience", value },
                  },
                })
              );
            }}
          >
            <option value="website">Experience: Website</option>
            <option value="app">Experience: App</option>
            <option value="learning">Experience: Learning</option>
          </select>


          <select
            value={layoutMode}
            onChange={e => {
              const value = e.target.value as LayoutMode;
              window.dispatchEvent(
                new CustomEvent("action", {
                  detail: {
                    type: "Action",
                    params: { name: "state:update", key: "layoutMode", value },
                  },
                })
              );
            }}
            title="Template = defaults (organs override). Custom = no template section layout."
          >
            <option value="template">Mode: Template</option>
            <option value="custom">Mode: Custom</option>
          </select>

          <select
            value={templateId}
            onChange={e => {
              const value = e.target.value;
              window.dispatchEvent(
                new CustomEvent("action", {
                  detail: {
                    type: "Action",
                    params: { name: "state:update", key: "templateId", value },
                  },
                })
              );
            }}
            style={{ minWidth: 180 }}
            title="Template: section layout (row/column/grid) + density. Change to see gaps and structure update."
          >
            <option value="">Template: (experience only)</option>
            {templateList.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>


          <button
            type="button"
            className="app-chrome-save"
            onClick={() => {
              const tree = getCurrentScreenTree();
              if (!tree) return;
              const profile = buildTemplateFromTree(tree);
              const payload = { ...profile } as Record<string, unknown>;
              delete payload.palette;
              delete payload.paletteName;
              const json = serializeTemplateProfile(payload as ReturnType<typeof buildTemplateFromTree>);
              const blob = new Blob([json], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${profile.id}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            title="Download current section layouts as a template JSON file."
          >
            Save Layout
          </button>

          <span className="app-chrome-hint" title="Header & Nav: change in right panel." aria-hidden="true">
            Header &amp; Nav: right panel
          </span>

          <select
            value={paletteName}
            onChange={e => {
              const value = e.target.value;
              window.dispatchEvent(
                new CustomEvent("action", {
                  detail: {
                    type: "Action",
                    params: { name: "state:update", key: "paletteName", value },
                  },
                })
              );
            }}
          >
            {PALETTES.map(p => (
              <option key={p} value={p}>
                Palette: {p}
              </option>
            ))}
          </select>


          <button type="button" onClick={() => setShowSections(v => !v)}>
            Sections ▾
          </button>
        </div>


        {showSections && (
          <div id="section-layout-panel" className="app-section-layout-panel" />
        )}

        <div ref={contentRef} className="app-content">{children}</div>
        {process.env.NODE_ENV === "development" && <InteractionTracerPanel />}
      </body>
    </html>
  );
}

