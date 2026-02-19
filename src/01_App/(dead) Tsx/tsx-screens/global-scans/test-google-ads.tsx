"use client";


import { useEffect, useState } from "react";


export default function TestGoogleAds() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    async function run() {
      try {
        const res = await fetch("/api/google-ads");


        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }


        const json = await res.json();
        setData(json);
      } catch (e: any) {
        setError(e.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }


    run();
  }, []);


  return (
    <div style={{ padding: 24, fontFamily: "monospace" }}>
      <h1>Google Ads API Proof</h1>


      {loading && <p>Loading…</p>}


      {error && (
        <pre style={{ color: "red" }}>
          ERROR:
          {"\n"}
          {error}
        </pre>
      )}


      {data && (
        <pre style={{ background: "#111", color: "#0f0", padding: 16 }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}


