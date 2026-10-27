import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import type { SidebarSection } from "@/components/ui/sidebar";
import type { PageId } from "@/lib/site";

// Every page: a skip link, the header, the page, the footer. reducedMotion="user"
// turns the springs into instant changes for people who ask for less motion.
export function Shell({ page, children, sections, activeId, footer = true }: { page: PageId; children: ReactNode; sections?: SidebarSection[]; activeId?: string; footer?: boolean }) {
  return (
    <MotionConfig reducedMotion="user">
      <a href="#main" className="sr-only z-50 rounded-sm bg-text px-4 py-2 font-semibold text-bg focus:not-sr-only focus:fixed focus:start-4 focus:top-3">
        Skip to the content
      </a>
      <SiteHeader page={page} sections={sections} activeId={activeId} />
      {children}
      {footer && <SiteFooter />}
    </MotionConfig>
  );
}
