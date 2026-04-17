import { loadCatalog } from "@/lib/deck-platform/registry";
import LearnDeckEditorPage from "./LearnDeckEditorPage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LearnSearchParams = Record<string, string | string[] | undefined>;

export default function LearnRootPage({ searchParams }: { searchParams: LearnSearchParams }) {
  const catalog = loadCatalog();
  if (catalog.length === 0) {
    return (
      <div style={{ padding: "1.5rem", maxWidth: 900, margin: "0 auto", color: "#475569", fontFamily: "system-ui, sans-serif" }}>
        No learn flows found in <code>src/01_App/**/learn/*/*.json</code> (flow root version files).
      </div>
    );
  }
  const [first] = [...catalog].sort((a, b) => {
    const appCmp = a.deckRef.appKey.localeCompare(b.deckRef.appKey);
    if (appCmp !== 0) return appCmp;
    return a.deckRef.flowKey.localeCompare(b.deckRef.flowKey);
  });
  return (
    <LearnDeckEditorPage
      appKey={first.deckRef.appKey}
      flowKey={first.deckRef.flowKey}
      versionKey={first.deckRef.defaultVersion}
      searchParams={searchParams}
    />
  );
}
