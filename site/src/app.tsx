import type { ComponentType } from "react";

// One React root per HTML file, picked by the data-page attribute on #root.
// Each page is its own chunk, so the playground's editor and the spec's text
// load only on the pages that use them.
export const PAGES = {
  home: () => import("@/pages/home"),
  start: () => import("@/pages/start"),
  playground: () => import("@/pages/playground"),
  reference: () => import("@/pages/reference"),
  internals: () => import("@/pages/internals"),
  spec: () => import("@/pages/spec"),
  missing: () => import("@/pages/missing"),
} satisfies Record<string, () => Promise<{ default: ComponentType }>>;

export type PageName = keyof typeof PAGES;
