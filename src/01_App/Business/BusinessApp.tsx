"use client";

import React from "react";
import Link from "next/link";

export default function BusinessApp() {
  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "1rem" }}>Business</h1>
      <p style={{ marginBottom: "1.5rem", color: "#666" }}>
        Choose a module:
      </p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        <li style={{ marginBottom: "0.5rem" }}>
          <Link href="/container-creations" className="domain-link">Container Creations</Link>
        </li>
        <li style={{ marginBottom: "0.5rem" }}>
          <Link href="/prayer-stream" className="domain-link">Prayer Stream</Link>
        </li>
      </ul>
    </div>
  );
}
