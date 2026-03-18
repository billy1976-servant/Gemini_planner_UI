/**
 * NavBar
 * 
 * Navigation bar component driven by navigation data.
 * No hardcoded content - purely presentational.
 */

import React from "react";
import Link from "next/link";

export interface NavigationItem {
  label: string;
  href: string;
  external?: boolean;
}

interface NavBarProps {
  items: NavigationItem[];
  siteTitle?: string;
}

export default function NavBar({ items, siteTitle }: NavBarProps) {
  // Format site title (fallback to domain if needed)
  const displayTitle = siteTitle 
    ? siteTitle.replace(/-/g, ".").replace(/\.com$/, "")
    : "gibson.com";

  // Filter navigation items: remove duplicates, junk labels, external links
  const filteredItems = React.useMemo(() => {
    const junkLabels = ["amazon", "privacy policy", "terms", "cookie", "sitemap"];
    const seen = new Set<string>();
    const filtered = items
      .filter((item) => {
        const labelLower = item.label.toLowerCase().trim();
        // Skip empty labels
        if (!labelLower) return false;
        // Skip junk labels
        if (junkLabels.some((junk) => labelLower.includes(junk))) return false;
        // Skip duplicates
        if (seen.has(labelLower)) return false;
        // Skip external links
        if (item.external === true) return false;
        // Skip absolute URLs that aren't relative paths (internal links should be relative)
        if (item.href.startsWith("http://") || item.href.startsWith("https://")) {
          return false;
        }
        seen.add(labelLower);
        return true;
      })
      .slice(0, 8); // Limit to 8 items
    return filtered;
  }, [items]);

  return (
    <nav style={{
      borderBottom: "1px solid var(--color-border)",
      backgroundColor: "var(--color-bg-primary)",
      position: "sticky",
      top: 0,
      zIndex: 100,
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
      backdropFilter: "blur(10px)",
    }}>
      <div className="site-container-inner" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: "var(--spacing-5)",
        paddingBottom: "var(--spacing-5)",
      }}>
        <Link href="/" style={{
          fontSize: "var(--font-size-2xl)",
          fontWeight: "var(--font-weight-bold)",
          color: "var(--color-text-primary)",
          textDecoration: "none",
          letterSpacing: "-0.02em",
        }}>
          {displayTitle}
        </Link>
        <div style={{
          display: "flex",
          gap: "var(--spacing-8)",
          alignItems: "center",
        }}>
          {filteredItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              style={{
                fontSize: "var(--font-size-base)",
                color: "var(--color-text-secondary)",
                textDecoration: "none",
                fontWeight: "var(--font-weight-medium)",
                transition: "color var(--transition-base)",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--color-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--color-text-secondary)";
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
