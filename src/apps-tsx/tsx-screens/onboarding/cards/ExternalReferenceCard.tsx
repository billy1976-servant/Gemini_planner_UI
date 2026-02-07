/**
 * ExternalReferenceCard - Display external references with disclaimers
 * 
 * Features:
 * - Shows external references as "External reference" with disclaimers
 * - Displays: "Third-party source; verify details."
 * - Shows publication name/date if available
 * - No sentiment scoring, no "best" claims
 * - Only shows if external references are enabled and whitelisted
 */

"use client";
import React from "react";
import type { ExternalReference } from "@/logic/products/external-references";
import { getWhitelistConfig } from "@/logic/products/external-references";

type ExternalReferenceCardProps = {
  references: ExternalReference[];
  productId?: string; // Optional: link references to specific product
};

export function ExternalReferenceCard({
  references,
  productId,
}: ExternalReferenceCardProps) {
  const config = getWhitelistConfig();

  // Don't render if external references are disabled
  if (!config.enabled) {
    return null;
  }

  // Filter to verified references only
  const verifiedReferences = references.filter((ref) => ref.verified);

  if (verifiedReferences.length === 0) {
    return null;
  }

  return (
    <div style={container}>
      <div style={header}>
        <h3 style={title}>External References</h3>
        <div style={disclaimer}>
          ⚠️ Third-party source; verify details.
        </div>
      </div>

      <div style={referencesList}>
        {verifiedReferences.map((reference) => (
          <ExternalReferenceItem
            key={reference.id}
            reference={reference}
          />
        ))}
      </div>
    </div>
  );
}

type ExternalReferenceItemProps = {
  reference: ExternalReference;
};

function ExternalReferenceItem({ reference }: ExternalReferenceItemProps) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div style={referenceItem}>
      <div style={referenceHeader}>
        <div style={referenceInfo}>
          {reference.publicationName && (
            <div style={publicationName}>{reference.publicationName}</div>
          )}
          {reference.publicationDate && (
            <div style={publicationDate}>
              {new Date(reference.publicationDate).toLocaleDateString()}
            </div>
          )}
          <a
            href={reference.url}
            target="_blank"
            rel="noopener noreferrer"
            style={referenceLink}
            onClick={(e) => e.stopPropagation()}
          >
            {reference.domain}
          </a>
        </div>
        <button
          style={expandButton}
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? "▼" : "▶"}
        </button>
      </div>

      {expanded && (
        <div style={referenceContent}>
          <div style={quotedSnippet}>
            "{reference.quotedSnippet}"
          </div>
          <div style={sourceInfo}>
            <strong>Source:</strong>{" "}
            <a
              href={reference.url}
              target="_blank"
              rel="noopener noreferrer"
              style={sourceLink}
            >
              {reference.url}
            </a>
          </div>
          <div style={verificationBadge}>
            ✓ Verified whitelisted domain
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const container: React.CSSProperties = {
  marginTop: 24,
  padding: 20,
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: 12,
};

const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
};

const title: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: "#e5e7eb",
  margin: 0,
};

const disclaimer: React.CSSProperties = {
  fontSize: 11,
  color: "#f59e0b",
  fontWeight: 600,
  padding: "4px 8px",
  background: "rgba(245, 158, 11, 0.1)",
  borderRadius: 4,
  border: "1px solid rgba(245, 158, 11, 0.3)",
};

const referencesList: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const referenceItem: React.CSSProperties = {
  padding: 12,
  background: "#0f172a",
  borderRadius: 8,
  border: "1px solid #334155",
};

const referenceHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "start",
};

const referenceInfo: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  flex: 1,
};

const publicationName: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#e5e7eb",
};

const publicationDate: React.CSSProperties = {
  fontSize: 11,
  color: "#94a3b8",
};

const referenceLink: React.CSSProperties = {
  fontSize: 12,
  color: "#60a5fa",
  textDecoration: "none",
  wordBreak: "break-all",
};

const expandButton: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#60a5fa",
  fontSize: 14,
  cursor: "pointer",
  padding: "4px 8px",
  display: "flex",
  alignItems: "center",
};

const referenceContent: React.CSSProperties = {
  marginTop: 12,
  padding: 12,
  background: "#1e293b",
  borderRadius: 6,
  border: "1px solid #334155",
};

const quotedSnippet: React.CSSProperties = {
  fontSize: 13,
  color: "#cbd5e1",
  fontStyle: "italic",
  marginBottom: 12,
  lineHeight: 1.6,
  padding: 8,
  background: "#0f172a",
  borderRadius: 4,
  borderLeft: "3px solid #3b82f6",
};

const sourceInfo: React.CSSProperties = {
  fontSize: 11,
  color: "#94a3b8",
  marginBottom: 8,
};

const sourceLink: React.CSSProperties = {
  color: "#60a5fa",
  textDecoration: "none",
  wordBreak: "break-all",
};

const verificationBadge: React.CSSProperties = {
  fontSize: 10,
  color: "#10b981",
  fontWeight: 600,
  padding: "4px 8px",
  background: "rgba(16, 185, 129, 0.1)",
  borderRadius: 4,
  border: "1px solid rgba(16, 185, 129, 0.3)",
  display: "inline-block",
  marginTop: 8,
};
