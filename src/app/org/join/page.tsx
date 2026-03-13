"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

export default function OrgJoinPage() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");
  const { data: session, status } = useSession();
  const [joining, setJoining] = useState(false);
  const [done, setDone] = useState<{ slug: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || status !== "authenticated" || joining || done) return;
    setJoining(true);
    setError(null);
    fetch("/api/org/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.slug) setDone({ slug: data.slug });
        else setError(data.message ?? "Failed to join");
      })
      .catch(() => setError("Request failed"))
      .finally(() => setJoining(false));
  }, [token, status, joining, done]);

  if (!token) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Invalid invite link. No token provided.</p>
        <Link href="/" style={{ marginTop: "1rem", display: "inline-block" }}>Home</Link>
      </div>
    );
  }
  if (status === "loading" || joining) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        {status === "unauthenticated" ? (
          <p>Sign in to accept the invite.</p>
        ) : (
          <p>Joining organization…</p>
        )}
      </div>
    );
  }
  if (status === "unauthenticated") {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Please sign in to accept this invite.</p>
        <Link href={`/prayer?callbackUrl=${encodeURIComponent(`/org/join?token=${token}`)}`}>
          Sign in
        </Link>
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ color: "#e11" }}>{error}</p>
        <Link href="/" style={{ marginTop: "1rem", display: "inline-block" }}>Home</Link>
      </div>
    );
  }
  if (done) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>You have joined the organization.</p>
        <Link href={`/org/${done.slug}`} style={{ marginTop: "1rem", display: "inline-block" }}>
          Go to organization
        </Link>
      </div>
    );
  }
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <p>Processing…</p>
    </div>
  );
}
