"use client";

import { CTASection as CTASectionType } from "@/lib/siteCompiler/types";

interface CTASectionProps {
  section: CTASectionType;
}

export default function CTASection({ section }: CTASectionProps) {
  return (
    <section
      className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white"
      style={{
        background: section.background || undefined,
      }}
    >
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          {section.headline}
        </h2>
        {section.description && (
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            {section.description}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={section.primaryCTA.url}
            className={`inline-block px-8 py-4 rounded-lg font-semibold text-lg transition-all ${
              section.primaryCTA.variant === "primary"
                ? "bg-white text-blue-600 hover:bg-gray-100"
                : section.primaryCTA.variant === "secondary"
                ? "bg-blue-700 hover:bg-blue-600 text-white"
                : "bg-transparent border-2 border-white hover:bg-white hover:text-blue-600 text-white"
            }`}
            target={section.primaryCTA.external ? "_blank" : undefined}
            rel={section.primaryCTA.external ? "noopener noreferrer" : undefined}
          >
            {section.primaryCTA.label}
          </a>
          {section.secondaryCTA && (
            <a
              href={section.secondaryCTA.url}
              className={`inline-block px-8 py-4 rounded-lg font-semibold text-lg transition-all ${
                section.secondaryCTA.variant === "primary"
                  ? "bg-white text-blue-600 hover:bg-gray-100"
                  : section.secondaryCTA.variant === "secondary"
                  ? "bg-blue-700 hover:bg-blue-600 text-white"
                  : "bg-transparent border-2 border-white hover:bg-white hover:text-blue-600 text-white"
              }`}
              target={section.secondaryCTA.external ? "_blank" : undefined}
              rel={
                section.secondaryCTA.external ? "noopener noreferrer" : undefined
              }
            >
              {section.secondaryCTA.label}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
