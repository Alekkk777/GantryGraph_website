import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DocsSidebar from '@/components/docs/Sidebar';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header variant="docs" />
      <div className="docs-layout">
        <DocsSidebar />
        <article className="docs-main">{children}</article>
      </div>
      <Footer />
    </>
  );
}
