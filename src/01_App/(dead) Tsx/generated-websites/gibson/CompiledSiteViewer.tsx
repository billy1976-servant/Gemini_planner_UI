"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SiteRenderer from "@/components/siteRenderer/SiteRenderer";
import { CompiledSiteModel } from "@/lib/siteCompiler/types";

export default function GibsonGuitarsSiteViewer() {
  const searchParams = useSearchParams();
  const [site, setSite] = useState<CompiledSiteModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Hardcode domain to gibson-com for Gibson Guitars
    const domain = "gibson-com";

    console.log("[GibsonGuitarsSiteViewer] Loading site for domain:", domain);

    // Fetch compiled site from API route (server-side)
    fetch(`/api/sites/${domain}`)
      .then((res) => {
        console.log("[GibsonGuitarsSiteViewer] API response status:", res.status);
        if (!res.ok) {
          return res.json().then((errData) => {
            console.error("[GibsonGuitarsSiteViewer] API error:", errData);
            throw new Error(errData.message || errData.error || `Failed to load site: ${res.statusText}`);
          });
        }
        return res.json();
      })
      .then((compiledSite: CompiledSiteModel) => {
        console.log("[GibsonGuitarsSiteViewer] Site loaded:", {
          domain: compiledSite.domain,
          pages: compiledSite.pages?.length || 0,
          products: compiledSite.products?.length || 0,
          navigation: compiledSite.navigation?.length || 0,
        });
        setSite(compiledSite);
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        console.error("[GibsonGuitarsSiteViewer] Error loading site:", err);
        setError(err.message || `Failed to load site: ${domain}`);
        setLoading(false);
      });
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading site...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="text-sm text-gray-600 space-y-2">
            <p>Failed to load Gibson Guitars site.</p>
            <p className="mt-4">
              Usage: <code className="bg-gray-200 px-2 py-1 rounded">
                ?screen=tsx:tsx-screens/sites/generated/Gibson_Guitars/CompiledSiteViewer
              </code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">No site data available</p>
        </div>
      </div>
    );
  }

  // Get page from query parameter
  const pagePath = searchParams.get("page") || "/";

  return <SiteRenderer model={site} pagePath={pagePath} />;
}
