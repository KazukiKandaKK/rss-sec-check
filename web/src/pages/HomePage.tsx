import { ArticleList } from "../components/ArticleList";

interface HomePageProps {
  sources: string[];
}

export function HomePage({ sources }: HomePageProps) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <ArticleList sources={sources} />
    </main>
  );
}
