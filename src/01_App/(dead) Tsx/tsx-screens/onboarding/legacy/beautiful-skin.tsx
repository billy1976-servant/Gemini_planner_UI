"use client";
import React from "react";


type Props = {
  children: React.ReactNode;
};


export default function BeautifulShell({ children }: Props) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top left, #1b1b1f, #000)",
        color: "white",
        padding: "80px 60px",
        boxSizing: "border-box",
      }}
    >
      {children}
    </div>
  );
}


