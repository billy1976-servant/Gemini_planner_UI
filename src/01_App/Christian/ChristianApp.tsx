"use client";

import React from "react";
import Link from "next/link";

export default function ChristianApp() {
  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "1rem" }}>Christian</h1>
      <p style={{ marginBottom: "1.5rem", color: "#666" }}>
        Choose a module:
      </p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        <li style={{ marginBottom: "0.5rem" }}>
          <Link href="/prayer" className="domain-link">Prayer</Link>
        </li>
        <li style={{ marginBottom: "0.5rem" }}>
          <Link href="/gospel" className="domain-link">Discipleship</Link>
        </li>
      </ul>
    </div>
  );
}
