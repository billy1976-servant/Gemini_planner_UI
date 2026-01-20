"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import JsonRenderer from "@/engine/core/json-renderer";
import { loadScreen } from "@/engine/core/screen-loader";
import SectionLayoutDropdown from "@/dev/section-layout-dropdown";
import { installRuntimeVerbInterpreter } from "@/engine/runtime/runtime-verb-interpreter";
import { resolveLandingPage } from "@/logic/runtime/landing-page-resolver";


/* ============================================================
   TSX SCREEN LOADER (NO JSON-RENDERER INVOLVEMENT)
   - This is the ONLY place TSX screens are handled.
   - Auto-discovers ALL files under /screens/tsx-screens
============================================================ */


/* ------------------------------------------------------------
   🔑 AUTO TSX MAP (EXISTING — UNCHANGED)
------------------------------------------------------------ */
const tsxContext = (require as any).context(
  "@/screens/tsx-screens",
  true,
  /\.tsx$/
);


const AUTO_TSX_MAP: Record<
  string,
  () => Promise<{ default: React.ComponentType<any> }>
> = {};


tsxContext.keys().forEach((key: string) => {
  const normalized = key.replace(/^.\//, "").replace(/\.tsx$/, "");
  AUTO_TSX_MAP[normalized] = () =>
    import(`@/screens/tsx-screens/${normalized}`);
});


/* ------------------------------------------------------------
   🔧 PATH NORMALIZER (UNCHANGED)
------------------------------------------------------------ */
function normalizeTsxPath(path: string) {
  return path
    .replace(/^tsx-screens\//, "")
    .replace(/\.screen$/, "")
    .replace(/\.tsx$/, "");
}


/* ------------------------------------------------------------
   🔑 RESOLVER (UNCHANGED)
------------------------------------------------------------ */
function resolveTsxScreen(path: string) {
  const normalized = normalizeTsxPath(path);
  const loader = AUTO_TSX_MAP[normalized];
  if (loader) {
    return dynamic(loader, { ssr: false });
  }
  return null;
}


installRuntimeVerbInterpreter();


export default function Page() {
  const searchParams = useSearchParams();
  const screen = searchParams.get("screen");

  // 🔑 TOP-LEVEL LOGGING: Track URL, screen param, and remount status
  const currentUrl = typeof window !== "undefined" ? window.location.href : "SSR";
  const [lastScreen, setLastScreen] = useState<string | null>(null);
  const [remountCount, setRemountCount] = useState(0);

  useEffect(() => {
    if (screen !== lastScreen) {
      setRemountCount(c => c + 1);
      setLastScreen(screen);
      console.log("[page] 🔄 SCREEN CHANGE DETECTED", {
        currentURL: currentUrl,
        screenParam: screen,
        previousScreen: lastScreen,
        remountCount: remountCount + 1,
        timestamp: Date.now(),
      });
    }
  }, [screen, lastScreen, currentUrl, remountCount]);

  const [json, setJson] = useState<any>(null);
  const [tsxMeta, setTsxMeta] = useState<{ path: string } | null>(null);
  const [TsxComponent, setTsxComponent] =
    useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);


  /* --------------------------------------------------
     DEV PANEL HOST (UNCHANGED)
  -------------------------------------------------- */
  useEffect(() => {
    const check = () => {
      const el = document.getElementById("section-layout-panel");
      if (el) setHost(el);
    };
    check();
    const id = setInterval(check, 50);
    return () => clearInterval(id);
  }, []);


  /* --------------------------------------------------
     CANONICAL SCREEN LOAD (JSON OR TSX DESCRIPTOR)
  -------------------------------------------------- */
  useEffect(() => {
    // 🔑 TOP-LEVEL: Log screen param resolution
    console.log("[page] 📍 SCREEN LOAD EFFECT TRIGGERED", {
      currentURL: typeof window !== "undefined" ? window.location.href : "SSR",
      screenParam: screen,
      searchParamsString: typeof window !== "undefined" ? window.location.search : "SSR",
      timestamp: Date.now(),
    });

    if (!screen) {
      // ✅ AUTO-RESOLVE LANDING PAGE
      try {
        const { flow, content } = resolveLandingPage();

        if (content) {
          // Merge content with flow decision
          const landingPageContent = {
            ...content,
            flow,
            root: {
              type: "json-skin", // Use JsonSkinEngine
              children: content.blocks ?? [],
            },
          };
          setJson(landingPageContent);
          setTsxMeta(null);
          setTsxComponent(null);
          setError(null);
          return;
        }
      } catch (err) {
        console.warn("[page] Landing page resolution failed:", err);
      }

      setJson(null);
      setTsxMeta(null);
      setTsxComponent(null);
      setError("Select a screen from the Navigator.");
      return;
    }


    // 🔑 Force fresh load - clear previous screen state
    setJson(null);
    setTsxMeta(null);
    setTsxComponent(null);
    setError(null);

    loadScreen(screen)
      .then((data) => {
        console.log("[page] ✅ SCREEN LOADED", {
          screenPath: screen,
          dataType: data?.__type,
          hasJson: !!data && !data.__type,
          timestamp: Date.now(),
        });

        // ✅ TSX SCREEN BRANCH (UNCHANGED)
        if (data?.__type === "tsx-screen" && typeof data.path === "string") {
          const C = resolveTsxScreen(data.path);
          if (!C) {
            setError(`TSX screen not found: ${data.path}`);
            setTsxMeta(null);
            setTsxComponent(null);
            setJson(null);
            return;
          }
          setTsxMeta({ path: data.path });
          setTsxComponent(() => C);
          setJson(null);
          setError(null);
          return;
        }


        // ✅ JSON SCREEN BRANCH — FIXED
        // IMPORTANT: store the FULL descriptor, but render ONLY its root
        setJson(data);
        setTsxMeta(null);
        setTsxComponent(null);
        setError(null);
      })
      .catch((err) => {
        setError(err?.message || "Screen not found");
        setJson(null);
        setTsxMeta(null);
        setTsxComponent(null);
      });
  }, [screen]);


  /* --------------------------------------------------
     RENDER
  -------------------------------------------------- */
  if (error) return <div style={{ color: "red" }}>{error}</div>;


  const overlay =
    host &&
    createPortal(
      <SectionLayoutDropdown
        screenJson={
          json ??
          {
            __type: "tsx-screen",
            path: tsxMeta?.path ?? "",
          }
        }
        onChange={setJson}
      />,
      host
    );


  // ✅ TSX SCREEN
  if (TsxComponent) {
    return (
      <>
        {overlay}
        <TsxComponent />
      </>
    );
  }


  if (!json) return <div>Loading…</div>;


  // ✅ FIX: render the ACTUAL screen root, not the descriptor
  const renderNode =
    json?.root ??
    json?.screen ??
    json?.node ??
    json;


  // 🔑 CRITICAL: React key MUST be derived from screen path, NEVER from json.id
  // Many screens share "screenRoot" id, causing React to reuse component instances
  // This prevents proper mounting/unmounting when switching between files
  
  // Simple hash function for JSON content (fallback only)
  const hashJson = (obj: any): string => {
    if (!obj) return "empty";
    const str = JSON.stringify(obj);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  };

  // ✅ ALWAYS use screen path, fallback to JSON hash (NEVER json.id)
  const screenKey = screen 
    ? screen.replace(/[^a-zA-Z0-9]/g, "-") // Sanitize path for React key
    : `screen-${hashJson(json)}`; // Hash entire JSON, not just id
  
  // Log once per render to confirm key changes between files
  console.log("[page] 🔑 JsonRenderer KEY RESOLVED", {
    currentURL: typeof window !== "undefined" ? window.location.href : "SSR",
    screenPath: screen,
    resolvedKey: screenKey,
    jsonId: json?.id, // For reference only - NOT used in key
    previousKey: lastScreen ? lastScreen.replace(/[^a-zA-Z0-9]/g, "-") : null,
    willRemount: lastScreen !== screen,
    note: screen ? "✅ Using screen path" : "⚠️ Using JSON hash (screen path missing)",
  });

  return (
    <>
      {overlay}
      <JsonRenderer key={screenKey} node={renderNode} defaultState={json?.state} />
    </>
  );
}


