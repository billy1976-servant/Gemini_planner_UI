"use client";

import dynamic from "next/dynamic";
import RegisterServiceWorker from "./pwa/RegisterServiceWorker";
import InstallPromptUI from "./install/InstallPromptUI";
import AuthControls from "./auth/AuthControls";

const ContactsTestButton = dynamic(
  () => import("./contacts/ContactsTestButton").then((m) => m.default),
  { ssr: false }
);

export default function MobileShell() {
  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div
      data-mobile-shell
      style={{
        position: "fixed",
        top: 8,
        right: 8,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 8,
        pointerEvents: "auto",
      }}
    >
      <RegisterServiceWorker />
      <InstallPromptUI />
      <AuthControls />
      {isDev && <ContactsTestButton />}
    </div>
  );
}
