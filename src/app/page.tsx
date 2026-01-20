"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import JsonRenderer from "@/engine/core/json-renderer";
import { loadScreen } from "@/engine/core/screen-loader";
import SectionLayoutDropdown from "@/dev/section-layout-dropdown";
import { installRuntimeVerbInterpreter } from "@/engine/runtime/runtime-verb-interpreter";


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
    if (!screen) {
      setJson(null);
      setTsxMeta(null);
      setTsxComponent(null);
      setError("Select a screen from the Navigator.");
      return;
    }


    loadScreen(screen)
      .then((data) => {
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


  return (
    <>
      {overlay}
      <JsonRenderer node={renderNode} />
    </>
  );
}


