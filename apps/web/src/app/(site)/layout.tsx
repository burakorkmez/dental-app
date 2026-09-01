import { SiteFooter, SiteNav } from '@/components/site-chrome';

/**
 * The public site: landing page plus the two legal pages the mobile app links
 * to. A route group, so it wraps these three routes without adding a URL
 * segment — /terms stays /terms.
 */
export default function SiteLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
