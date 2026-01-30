"use client";

import { ContentSection as ContentSectionType } from "@/lib/siteCompiler/types";

interface ContentSectionProps {
  section: ContentSectionType;
}

export default function ContentSection({ section }: ContentSectionProps) {
  const layoutClass =
    section.layout === "two-column"
      ? "grid grid-cols-1 md:grid-cols-2 gap-8"
      : section.layout === "three-column"
      ? "grid grid-cols-1 md:grid-cols-3 gap-8"
      : "max-w-4xl mx-auto";

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {section.title && (
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            {section.title}
          </h2>
        )}
        <div className={layoutClass}>
          {section.content.map((block, index) => (
            <ContentBlock key={index} block={block} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ContentBlock({ block }: { block: ContentSectionType["content"][0] }) {
  switch (block.type) {
    case "heading":
      return (
        <h3 className="text-2xl font-bold text-gray-900 mb-4">{block.content}</h3>
      );
    case "text":
      return (
        <p className="text-gray-700 text-lg leading-relaxed mb-6">
          {block.content}
        </p>
      );
    case "quote":
      return (
        <blockquote className="border-l-4 border-blue-500 pl-6 italic text-gray-700 text-lg my-6">
          {block.content}
        </blockquote>
      );
    case "list":
      const items = block.content.split("\n").filter((item) => item.trim());
      return (
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
          {items.map((item, i) => (
            <li key={i}>{item.trim()}</li>
          ))}
        </ul>
      );
    default:
      return (
        <div className="text-gray-700 mb-6">{block.content}</div>
      );
  }
}
