"use client";


import { useEffect, useState } from "react";
import { subscribeState, getState } from "./state-store";


/**
 * USER INPUT VIEWER (UNIVERSAL)
 *
 * - Lives in state/
 * - Renders ANY derived state value
 * - Not journal-specific
 * - No business logic
 * - Pure state → screen
 *
 * Usage:
 *   <UserInputViewer stateKey="journalEntries" />
 *   <UserInputViewer stateKey="formValues" />
 */


export default function UserInputViewer({
  stateKey,
}: {
  stateKey: string;
}) {
  const [, force] = useState(0);


  useEffect(() => {
    const unsubscribe = subscribeState(() => {
      force(v => v + 1);
    });


    // 🔑 React cleanup MUST return void
    return () => {
      unsubscribe();
    };
  }, []);


  const state = getState() as any;
  const value = state?.[stateKey];


  if (value == null) {
    return <div style={{ opacity: 0.4 }}>No value</div>;
  }


  // Arrays → list
  if (Array.isArray(value)) {
    return (
      <ul>
        {value.map((v, i) => (
          <li key={i}>{renderValue(v)}</li>
        ))}
      </ul>
    );
  }


  // Objects → JSON
  if (typeof value === "object") {
    return <pre>{JSON.stringify(value, null, 2)}</pre>;
  }


  // Primitives
  return <div>{String(value)}</div>;
}


function renderValue(v: any) {
  if (typeof v === "string") return v;
  if (typeof v === "number") return v;
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

