"use client";

import { ValueSection as ValueSectionType } from "@/lib/siteCompiler/types";

interface ValueSectionProps {
  section: ValueSectionType;
}

export default function ValueSection({ section }: ValueSectionProps) {
  const layoutClass =
    section.layout === "grid"
      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      : section.layout === "carousel"
      ? "flex overflow-x-auto gap-6 pb-4"
      : "flex flex-col gap-6";

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {section.title && (
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            {section.title}
          </h2>
        )}
        <div className={layoutClass}>
          {section.valueProps.map((valueProp) => (
            <div
              key={valueProp.id}
              className="bg-gray-50 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start mb-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white mr-4 ${
                    valueProp.type === "benefit"
                      ? "bg-green-500"
                      : valueProp.type === "lossAvoidance"
                      ? "bg-red-500"
                      : "bg-blue-500"
                  }`}
                >
                  {valueProp.rank}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {valueProp.dimensionId.charAt(0).toUpperCase() +
                      valueProp.dimensionId.slice(1)}
                  </h3>
                  <p className="text-gray-700">{valueProp.statement}</p>
                </div>
              </div>
              {valueProp.magnitude && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-2xl font-bold text-gray-900">
                    {valueProp.magnitude.value} {valueProp.magnitude.unit}
                  </div>
                  <div className="text-sm text-gray-500 capitalize">
                    {valueProp.magnitude.confidence} confidence
                  </div>
                </div>
              )}
              {valueProp.source?.citation && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <a
                    href={valueProp.source.citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {valueProp.source.citation.label} →
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
