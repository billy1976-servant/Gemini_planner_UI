import { compileSite, getPage } from "@/lib/siteCompiler/compileSite";
import SiteRenderer from "@/components/siteRenderer/SiteRenderer";
import { notFound } from "next/navigation";

interface SitePageProps {
  params: Promise<{
    domain: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
}

export async function generateStaticParams() {
  // This could be enhanced to pre-generate all known sites
  // For now, we'll use dynamic rendering
  return [];
}

export default async function SitePage({ params, searchParams }: SitePageProps) {
  const { domain } = await params;
  const { page } = await searchParams;

  try {
    const model = await compileSite(domain);
    const pagePath = page || "/";

    return <SiteRenderer model={model} pagePath={pagePath} />;
  } catch (error) {
    console.error(`[SitePage] Error compiling site ${domain}:`, error);
    notFound();
  }
}

export async function generateMetadata({ params }: SitePageProps) {
  const { domain } = await params;
  
  try {
    const model = await compileSite(domain);
    const homepage = model.pages.find((p) => p.path === "/");
    
    return {
      title: homepage?.title || model.brand.name,
      description: model.brand.description || homepage?.metadata?.description,
    };
  } catch {
    return {
      title: "Site Not Found",
    };
  }
}
