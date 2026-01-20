"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";


/* ============================================================
   🎨 PALETTE ENGINE
============================================================ */
import { setPalette, getPaletteName } from "@/engine/core/palette-store";


/* ============================================================
   🧱 LAYOUT ENGINE
============================================================ */
import { setLayout } from "@/engine/core/layout-store";


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


  const [index, setIndex] = useState<ScreensIndex[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("");
  const [selectedFile, setSelectedFile] = useState("");


  const [paletteName, setPaletteName] = useState(getPaletteName());
  const [experience, setExperience] =
    useState<"website" | "app" | "learning">("website");


  const [showSections, setShowSections] = useState(false);


  /* ============================================================
     🔁 INSTALL BEHAVIOR ROUTER (ONCE)
     ❗ NO STATE REPLAY HERE
  ============================================================ */
  useEffect(() => {
    installBehaviorListener((to: string) => {
      router.replace(`/?screen=${encodeURIComponent(to)}`);
    });
  }, [router]);


  /* ============================================================
     🧱 APPLY EXPERIENCE PRESET
  ============================================================ */
  useEffect(() => {
    setLayout({ preset: experience });
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

