"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";


/* ============================================================
   🎨 PALETTE ENGINE
============================================================ */
import { setPalette, getPaletteName } from "@/engine/core/palette-store";


/* ============================================================
   🧱 LAYOUT ENGINE
============================================================ */
import { setLayout, getLayout, subscribeLayout } from "@/engine/core/layout-store";


/* ============================================================
   📐 TEMPLATE PROFILES (layout + preset override)
============================================================ */
import { getTemplateList } from "@/layout/template-profiles";

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
import websiteProfile from "@/layout/presentation/website.profile.json";
import appProfile from "@/layout/presentation/app.profile.json";
import learningProfile from "@/layout/presentation/learning.profile.json";


/* ============================================================
   🔒 STATIC REGISTRIES
============================================================ */
const PALETTES = [
  "default",
  "premium",
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
  const templateId = (layoutSnapshot as { templateId?: string })?.templateId ?? "modern-hero-centered";
  const templateList = getTemplateList();

  const [showSections, setShowSections] = useState(false);

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
      <body style={{ margin: 0 }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: 12,
            background: "#111",
            color: "white",
            position: "sticky",
            top: 0,
            zIndex: 10,
            alignItems: "center",
          }}
        >
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


          <select
            value={experience}
            onChange={e => setExperience(e.target.value as any)}
            style={{ marginLeft: "auto" }}
          >
            <option value="website">Experience: Website</option>
            <option value="app">Experience: App</option>
            <option value="learning">Experience: Learning</option>
          </select>


          <select
            value={templateId}
            onChange={e => setLayout({ templateId: e.target.value })}
            style={{ marginLeft: "auto" }}
            title="Template layout + preset (sections, density)"
          >
            {templateList.map((t) => (
              <option key={t.id} value={t.id}>
                Template: {t.label}
              </option>
            ))}
          </select>


          <select value={paletteName} onChange={e => onPaletteChange(e.target.value)}>
            {PALETTES.map(p => (
              <option key={p} value={p}>
                Palette: {p}
              </option>
            ))}
          </select>


          <button
            onClick={() => setShowSections(v => !v)}
            style={{
              background: "#222",
              color: "white",
              border: "1px solid #444",
              padding: "4px 8px",
              cursor: "pointer",
            }}
          >
            Sections ▾
          </button>
        </div>


        {showSections && (
          <div
            id="section-layout-panel"
            style={{
              position: "sticky",
              top: 48,
              zIndex: 9,
              background: "#1a1a1a",
              padding: 12,
              borderBottom: "1px solid #333",
            }}
          />
        )}


        <div style={{ padding: 20 }}>{children}</div>
      </body>
    </html>
  );
}

