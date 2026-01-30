/**
 * renderPage
 * 
 * Orchestrates page rendering with navigation, sections, and footer.
 * Pure function - no side effects, no hardcoded content.
 */

import React from "react";
import PageContainer from "@/components/site/PageContainer";
import NavBar from "@/components/site/NavBar";
import Footer from "@/components/site/Footer";
import renderSection from "./renderSection";
import { PageModel, ScreenModel } from "@/lib/site-compiler/compileSiteToScreenModel";

interface RenderPageProps {
  page: PageModel;
  site: ScreenModel;
}

export default function renderPage({ page, site }: RenderPageProps): React.ReactElement {
  return (
    <PageContainer>
      <NavBar items={site.navigation} siteTitle={site.siteId} />
      
      <main>
        {page.sections.map((section) => (
          <React.Fragment key={section.id}>
            {renderSection({ section, products: site.products })}
          </React.Fragment>
        ))}
      </main>
      
      <Footer siteId={site.siteId} />
    </PageContainer>
  );
}
