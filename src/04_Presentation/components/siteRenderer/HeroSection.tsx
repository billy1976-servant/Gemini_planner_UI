"use client";

import Image from "next/image";
import { HeroSection as HeroSectionType } from "@/lib/siteCompiler/types";

interface HeroSectionProps {
  section: HeroSectionType;
}

export default function HeroSection({ section }: HeroSectionProps) {
  return (
    <section
      className="relative w-full min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white"
      style={{
        backgroundImage: section.backgroundImage
          ? `url(${section.backgroundImage})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        {section.image && (
          <div className="mb-8 flex justify-center">
            <div 
              className="relative w-full max-w-4xl aspect-video rounded-lg overflow-hidden shadow-2xl"
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
              }}
            >
              <Image
                src={section.image.url}
                alt={section.image.alt}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        )}
        <h1 className="text-5xl md:text-7xl font-bold mb-6 drop-shadow-lg">
          {section.headline}
        </h1>
        {section.subheadline && (
          <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-3xl mx-auto">
            {section.subheadline}
          </p>
        )}
        {section.cta && (
          <a
            href={section.cta.url}
            className={`inline-block px-8 py-4 rounded-lg font-semibold text-lg transition-all ${
              section.cta.variant === "primary"
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : section.cta.variant === "secondary"
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-transparent border-2 border-white hover:bg-white hover:text-gray-900 text-white"
            }`}
            target={section.cta.external ? "_blank" : undefined}
            rel={section.cta.external ? "noopener noreferrer" : undefined}
          >
            {section.cta.label}
          </a>
        )}
      </div>
    </section>
  );
}
