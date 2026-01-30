"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function SiteIndex() {
  const [sites, setSites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sites/list")
      .then((res) => res.json())
      .then((data) => {
        setSites(data.sites || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[SiteIndex] Error loading sites:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-12 text-gray-900">
          Compiled Sites
        </h1>
        
        {sites.length === 0 ? (
          <div className="text-center">
            <p className="text-gray-600 mb-4">No compiled sites found.</p>
            <p className="text-sm text-gray-500">
              Sites are compiled to: <code className="bg-gray-200 px-2 py-1 rounded">src/screens/generated-websites/</code>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sites.map((site) => (
              <Link
                key={site}
                href={`/?screen=tsx:tsx-screens/sites/CompiledSiteViewer&domain=${site}`}
                className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6"
              >
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  {site.replace(/-/g, ".")}
                </h2>
                <p className="text-gray-600 mb-4">View compiled site</p>
                <div className="text-sm text-blue-600 hover:text-blue-800">
                  View Site →
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Or access directly via URL:</p>
          <div className="space-y-2">
            {sites.map((site) => (
              <div key={site} className="text-sm">
                <code className="bg-gray-200 px-3 py-2 rounded">
                  ?screen=tsx:tsx-screens/sites/CompiledSiteViewer&domain={site}
                </code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
