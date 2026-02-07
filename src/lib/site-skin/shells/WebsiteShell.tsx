"use client";

import React, { useEffect } from "react";

export default function WebsiteShell({
  header,
  hero,
  content,
  products,
  footer,
}: {
  header?: React.ReactNode;
  hero?: React.ReactNode;
  content?: React.ReactNode;
  products?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    console.log("[MOUNT]", "WebsiteShell");
    return () => console.log("[UNMOUNT]", "WebsiteShell");
  }, []);

  // Page passes full JSON tree as content; header/hero/footer are inside that tree
  const mainContent = content ?? (
    <>
      {header}
      {hero}
      {content}
      {products}
      {footer}
    </>
  );

  return (
    <div
      className="site-container"
      style={{
        minHeight: "100vh",
        background: "var(--color-bg-primary)",
      }}
    >
      <main
        className="site-container-inner"
        style={{
          paddingTop: "var(--spacing-6)",
          paddingBottom: "var(--spacing-16)",
        }}
      >
        {mainContent}
      </main>
    </div>
  );
}

