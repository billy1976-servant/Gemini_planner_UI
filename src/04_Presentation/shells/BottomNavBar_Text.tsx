"use client";

import { useRouter } from "next/navigation";

export default function BottomNavBar_Text() {
  const router = useRouter();

  const go = (path: string) => {
    router.push(`/?screen=${path}`);
  };

  const linkStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    padding: 0,
    margin: 0,
    font: "inherit",
    fontSize: "14px",
    fontWeight: 400,
    color: "#5f6368",
    cursor: "pointer",
    textDecoration: "none",
  };

  return (
    <nav
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "14px 12px",
        background: "#f1f1f1",
        borderTop: "1px solid rgba(0,0,0,0.08)",
      }}
    >
      <button type="button" style={linkStyle} onClick={() => go("HiClarify/me/me_home")}>Me</button>
      <button type="button" style={linkStyle} onClick={() => go("HiClarify/play/play_home")}>Plans</button>
      <button type="button" style={linkStyle} onClick={() => go("HiClarify/build/build_home")}>Build</button>
      <button type="button" style={linkStyle} onClick={() => go("HiClarify/others/others_home")}>People</button>
      <button type="button" style={linkStyle} onClick={() => go("HiClarify/tools/tools_home")}>Apps</button>
    </nav>
  );
}
