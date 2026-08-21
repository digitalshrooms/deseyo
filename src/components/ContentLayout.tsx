import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface ContentLayoutProps {
  title: string;
  children: React.ReactNode;
  backLink?: boolean;
}

export const ContentLayout = ({ title, children, backLink = true }: ContentLayoutProps) => {
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.getAttribute('data-theme');
    root.setAttribute('data-theme', 'light');

    // ThemeProvider's own effect can fire after this one on a fresh page
    // load and re-apply the stored (possibly dark) theme, so keep forcing
    // light for as long as this page is mounted.
    const observer = new MutationObserver(() => {
      if (root.getAttribute('data-theme') !== 'light') root.setAttribute('data-theme', 'light');
    });
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      observer.disconnect();
      if (prev) root.setAttribute('data-theme', prev);
    };
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        {backLink && (
          <Link
            to="/"
            className="inline-flex items-center gap-2 mb-8 transition-colors hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeft size={20} />
            <span>Zpět na úvodní stránku</span>
          </Link>
        )}

        <div className="mb-12">
          <h1 className="font-normal" style={{ fontSize: 'clamp(28px, 6vw, 40px)', color: 'var(--primary)' }}>
            {title}
          </h1>
        </div>

        <div className="prose prose-gray max-w-none">
          {children}
        </div>

        <div className="mt-16 pt-8" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--text-subtle)' }}>
            © 2026 DESEYO s.r.o. | Všechna práva vyhrazena
          </p>
        </div>
      </div>
    </div>
  );
};
