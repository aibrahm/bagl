import { lazy, Suspense, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarDrawer, type SidebarSection } from "@/components/ui/sidebar";
import { BASE, NAV, REPO, type PageId } from "@/lib/site";
import { cn } from "@/lib/utils";

const SearchDialog = lazy(() => import("@/components/search-dialog"));

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

export function SiteHeader({ page, sections = [], activeId = "" }: { page: PageId; sections?: SidebarSection[]; activeId?: string }) {
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  useEffect(() => {
    if (searching) setSearched(true);
  }, [searching]);
  const [mac, setMac] = useState(true);

  useEffect(() => {
    setMac(/Mac|iPhone|iPad/.test(navigator.platform));
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearching((s) => !s);
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  const drawer: SidebarSection[] = [{ title: "Pages", items: NAV.map((n) => ({ id: `page-${n.id}`, label: n.label, href: n.href })) }, ...sections];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-[color-mix(in_oklch,var(--bg)_92%,transparent)] backdrop-blur-md supports-[not(backdrop-filter:blur(1px))]:bg-bg">
      <div className="mx-auto flex h-[var(--header-h)] max-w-[90rem] items-center gap-2 px-4 sm:px-6">
        <SidebarDrawer sections={drawer} activeId={activeId || `page-${page}`} label="Menu" />
        <a href={BASE} className="me-2 flex-none rounded-sm py-2 pe-1 active:opacity-70" aria-label="Bagl home">
          <Logo className="w-[140px]" title="Bagl" />
        </a>
        <nav aria-label="Pages" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((n) => (
              <li key={n.id}>
                <a
                  href={n.href}
                  aria-current={page === n.id ? "page" : undefined}
                  className={cn(
                    "rounded-sm px-3 py-2 text-[0.9375rem] no-underline active:opacity-70",
                    page === n.id ? "font-semibold text-text underline decoration-accent decoration-2 underline-offset-[6px]" : "text-muted hover:text-text",
                  )}
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ms-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSearching(true)}
            className="flex h-10 items-center gap-2 rounded-sm border border-line px-3 text-sm text-muted hover:border-text hover:text-text active:opacity-70"
            aria-keyshortcuts={mac ? "Meta+K" : "Control+K"}
          >
            <Search aria-hidden className="size-4" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden rounded-sm border border-line px-1 font-mono text-[11px] sm:inline">{mac ? "⌘K" : "Ctrl K"}</kbd>
          </button>
          <ThemeToggle />
          <a href={REPO} className="grid size-10 place-items-center rounded-sm text-text hover:bg-line-soft active:opacity-70" aria-label="Bagl on GitHub" title="Bagl on GitHub">
            <GitHubMark className="size-[18px]" />
          </a>
        </div>
      </div>
      {searched && (
        <Suspense fallback={null}>
          <SearchDialog open={searching} onClose={() => setSearching(false)} />
        </Suspense>
      )}
    </header>
  );
}
