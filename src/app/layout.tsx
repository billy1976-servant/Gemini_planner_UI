"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";

import "@/styles/site-theme.css";

/* ============================================================
   🎨 PALETTE ENGINE
============================================================ */
import { setPalette, getPaletteName } from "@/engine/core/palette-store";
import { usePaletteCSS } from "@/lib/site-renderer/palette-bridge";


/* ============================================================
   🧱 LAYOUT ENGINE
============================================================ */
import { setLayout, getLayout, subscribeLayout, type LayoutMode } from "@/engine/core/layout-store";
import { getCurrentScreenTree } from "@/engine/core/current-screen-tree-store";
import { buildTemplateFromTree, serializeTemplateProfile } from "@/lib/layout/save-current-as-template";


/* ============================================================
   📐 TEMPLATE PROFILES (layout + preset override)
============================================================ */
import { getTemplateList } from "@/lib/layout/template-profiles";

/* ============================================================
   🧠 STATE (PHASE B: INTERNAL VIEW NAV)
============================================================ */
import { dispatchState } from "@/state/state-store";


/* ============================================================
   🧠 BEHAVIOR LISTENER
============================================================ */
import { installBehaviorListener } from "@/engine/core/behavior-listener";


/* ============================================================
   📐 EXPERIENCE PROFILES
============================================================ */
import websiteProfile from "@/lib/layout/presentation/website.profile.json";
import appProfile from "@/lib/layout/presentation/app.profile.json";
import learningProfile from "@/lib/layout/presentation/learning.profile.json";


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
  website: websiteProfile,
  app: appProfile,
  learning: learningProfile,
};


type ScreensIndex = {
  category: string;
  folders: Record<string, string[]>;
};


export default function RootLayout({ children }: any) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [index, setIndex] = useState<ScreensIndex[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("");
  const [selectedFile, setSelectedFile] = useState("");


  const [paletteName, setPaletteName] = useState(getPaletteName());
  const [experience, setExperience] =
    useState<"website" | "app" | "learning">("website");

  const layoutSnapshot = useSyncExternalStore(subscribeLayout, getLayout, getLayout);
  const templateId = (layoutSnapshot as { templateId?: string })?.templateId ?? "";
  const layoutMode = (layoutSnapshot as { mode?: LayoutMode })?.mode ?? "template";
  const templateList = getTemplateList();

  const [showSections, setShowSections] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  /* Apply palette to document root so app-chrome + content both inherit */
  usePaletteCSS();

  /* ============================================================
     🔗 DEMO: INITIAL EXPERIENCE FROM URL
     Deep links can open in a specific experience, e.g. ?experience=app
  ============================================================ */
  useEffect(() => {
    const exp = searchParams.get("experience");
    if (exp === "website" || exp === "app" || exp === "learning") {
      setExperience(exp);
    }
  }, [searchParams]);

  /* ============================================================
     🔁 INSTALL BEHAVIOR ROUTER (ONCE)
     ❗ NO STATE REPLAY HERE
  ============================================================ */
  useEffect(() => {
    installBehaviorListener((to: string) => {
      // Phase B: Back-compat for legacy multi-view screens.
      // Destinations like "|Signup" are *view IDs*, not screen file paths.
      if (typeof to === "string" && to.startsWith("|")) {
        dispatchState("state:currentView", { value: to });
        return;
      }
      router.replace(`/?screen=${encodeURIComponent(to)}`);
    });
  }, [router]);


  /* ============================================================
     🧱 APPLY EXPERIENCE PRESET
  ============================================================ */
  useEffect(() => {
    setLayout({ experience });
  }, [experience]);


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


  const folderOptions = selectedCategoryObj
    ? Object.keys(selectedCategoryObj.folders || {})
    : [];


  const fileOptions =
    selectedCategoryObj && selectedFolder
      ? selectedCategoryObj.folders[selectedFolder] || []
      : [];


  const navigate = (category: string, folder: string, file: string) => {
    const screenPath = `${category}/${folder}/${file}`;
    router.replace(`/?screen=${encodeURIComponent(screenPath)}`);
  };


  const onPaletteChange = (name: string) => {
    setPalette(name);
    setPaletteName(name);
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
              setSelectedFolder(e.target.value);
              setSelectedFile("");
            }}
          >
            <option value="">Select Folder…</option>
            {folderOptions.map(f => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>


          <select
            value={selectedFile}
            disabled={!selectedCategory || !selectedFolder}
            onChange={e => {
              const file = e.target.value;
              setSelectedFile(file);
              if (selectedCategory && selectedFolder && file) {
                navigate(selectedCategory, selectedFolder, file);
              }
            }}
          >
            <option value="">Select App JSON…</option>
            {fileOptions.map(f => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>


          <span className="app-chrome-spacer" aria-hidden="true" />

          <select
            value={experience}
            onChange={e => setExperience(e.target.value as any)}
          >
            <option value="website">Experience: Website</option>
            <option value="app">Experience: App</option>
            <option value="learning">Experience: Learning</option>
          </select>


          <select
            value={layoutMode}
            onChange={e => setLayout({ mode: e.target.value as LayoutMode })}
            title="Template = defaults (organs override). Custom = no template section layout."
          >
            <option value="template">Mode: Template</option>
            <option value="custom">Mode: Custom</option>
          </select>

          <select
            value={templateId}
            onChange={e => setLayout({ templateId: e.target.value })}
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
              const json = serializeTemplateProfile(profile);
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

          <select value={paletteName} onChange={e => onPaletteChange(e.target.value)}>
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
      </body>
    </html>
  );
}

