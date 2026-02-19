"use client";

import React from "react";

type NodeProps = Record<string, any>;

function Header({ title }: NodeProps) {
  return (
    <header
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--spacing-md, 1rem)",
        background: "var(--color-bg-secondary, var(--color-surface-1))",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <span style={{ fontSize: "var(--text-lg, 1.25rem)", fontWeight: 600, color: "var(--color-text-primary)" }}>
        {title ?? ""}
      </span>
    </header>
  );
}

function Hero({ headline, subheadline }: NodeProps) {
  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--spacing-xl, 2rem)",
        background: "var(--color-surface-hero-accent, var(--color-bg-primary))",
        color: "var(--color-text-primary)",
      }}
    >
      <h1 style={{ fontSize: "var(--text-2xl, 1.5rem)", fontWeight: 700, margin: 0, textAlign: "center" }}>
        {headline ?? ""}
      </h1>
      {subheadline && (
        <p style={{ fontSize: "var(--text-md, 1rem)", color: "var(--color-text-secondary)", margin: "var(--spacing-sm, 0.5rem) 0 0" }}>
          {subheadline}
        </p>
      )}
    </section>
  );
}

function ContentSection({ heading, content }: NodeProps) {
  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "var(--spacing-md, 1rem)",
        background: "var(--color-bg-primary)",
        color: "var(--color-text-primary)",
      }}
    >
      {heading && (
        <h2 style={{ fontSize: "var(--text-xl, 1.25rem)", fontWeight: 600, margin: "0 0 var(--spacing-sm, 0.5rem)" }}>
          {heading}
        </h2>
      )}
      {content && <div style={{ color: "var(--color-text-secondary)" }}>{content}</div>}
    </section>
  );
}

function Cta({ label, href }: NodeProps) {
  const url = href ?? "#";
  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "var(--spacing-lg, 1.5rem)",
        background: "var(--color-bg-secondary)",
      }}
    >
      <a
        href={url}
        style={{
          padding: "var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem)",
          background: "var(--color-primary)",
          color: "var(--color-on-primary)",
          borderRadius: "var(--radius-md, 0.5rem)",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        {label ?? "Learn more"}
      </a>
    </section>
  );
}

function Footer({ text }: NodeProps) {
  return (
    <footer
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--spacing-md, 1rem)",
        background: "var(--color-bg-secondary)",
        borderTop: "1px solid var(--color-border)",
        color: "var(--color-text-secondary)",
        fontSize: "var(--text-sm, 0.875rem)",
      }}
    >
      {text ?? ""}
    </footer>
  );
}

function FlowEmbed({ flowId, title }: NodeProps) {
  const flowUrl = flowId ? `/dev?flow=${encodeURIComponent(flowId)}` : "/dev";
  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "var(--spacing-lg, 1.5rem)",
        background: "var(--color-bg-primary)",
      }}
    >
      {title && (
        <h2 style={{ fontSize: "var(--text-xl, 1.25rem)", fontWeight: 600, margin: "0 0 var(--spacing-sm, 0.5rem)", color: "var(--color-text-primary)" }}>
          {title}
        </h2>
      )}
      <a
        href={flowUrl}
        style={{
          padding: "var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem)",
          background: "var(--color-primary)",
          color: "var(--color-on-primary)",
          borderRadius: "var(--radius-md, 0.5rem)",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Open flow
      </a>
    </section>
  );
}

function ProductGrid({ products }: NodeProps) {
  const list = Array.isArray(products) ? products : [];
  if (list.length === 0) {
    return (
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "var(--spacing-lg, 1.5rem)",
          background: "var(--color-bg-primary)",
          color: "var(--color-text-muted)",
          fontSize: "var(--text-sm, 0.875rem)",
        }}
      >
        No products yet.
      </section>
    );
  }
  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "var(--spacing-md, 1rem)",
        background: "var(--color-bg-primary)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "var(--spacing-md, 1rem)",
        }}
      >
        {list.map((p: any, i: number) => (
          <div
            key={p?.id ?? i}
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "var(--spacing-sm, 0.5rem)",
              background: "var(--color-surface-1)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md, 0.5rem)",
            }}
          >
            {p?.name && <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{p.name}</span>}
            {p?.price != null && <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm, 0.875rem)" }}>${Number(p.price)}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}

const REGISTRY: Record<string, React.ComponentType<NodeProps>> = {
  header: Header,
  hero: Hero,
  "content-section": ContentSection,
  cta: Cta,
  footer: Footer,
  "flow-embed": FlowEmbed,
  "product-grid": ProductGrid,
};

export function getNodeComponent(type: string): React.ComponentType<NodeProps> | undefined {
  return REGISTRY[type];
}

export default REGISTRY;
