import LearnDeckEditorPage from "@/app/learn/LearnDeckEditorPage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LearnSearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  params: { appKey: string; flowKey: string; versionKey: string };
  searchParams: LearnSearchParams;
};

export default function LearnDeckPage({ params, searchParams }: PageProps) {
  return (
    <LearnDeckEditorPage
      appKey={params.appKey}
      flowKey={params.flowKey}
      versionKey={params.versionKey}
      searchParams={searchParams}
    />
  );
}
