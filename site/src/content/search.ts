import toc from "virtual:toc";
import type { CommandItem } from "@/components/ui/command-menu";
import { BASE, NAV } from "@/lib/site";

// What the search box (Ctrl or Cmd + K) can find: every page, and every h2 and h3 on the docs pages.
const PAGES: Record<keyof typeof toc, { label: string; path: string }> = {
  start: { label: "Get started", path: "start/" },
  reference: { label: "Reference", path: "reference/" },
  spec: { label: "Specification", path: "spec/" },
  internals: { label: "Internals", path: "internals/" },
};

export const SEARCH_ITEMS: CommandItem[] = [
  ...NAV.map((n) => ({ id: `page-${n.id}`, title: n.label, group: "Page", href: n.href })),
  ...Object.entries(PAGES).flatMap(([key, p]) =>
    toc[key as keyof typeof toc]
      .filter((h) => h.depth === 2 || h.depth === 3)
      .map((h) => ({ id: `${key}-${h.id}`, title: h.text, group: p.label, href: `${BASE}${p.path}#${h.id}` })),
  ),
];
