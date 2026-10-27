// Where the site lives. It is served at /bagl/ on both hosts
// (aibrahm.github.io/bagl and abdelrahmanibrm.com/bagl), so links can start with BASE.
export const BASE = import.meta.env.BASE_URL;
export const REPO = "https://github.com/aibrahm/bagl";
export const AUTHOR_PAGE = "https://abdelrahmanibrm.com/projects/bagl-compiler";

export type PageId = "home" | "start" | "playground" | "reference" | "internals" | "spec" | "missing";

export const NAV: { id: PageId; label: string; href: string }[] = [
  { id: "start", label: "Get started", href: `${BASE}start/` },
  { id: "playground", label: "Playground", href: `${BASE}playground/` },
  { id: "reference", label: "Reference", href: `${BASE}reference/` },
  { id: "spec", label: "Specification", href: `${BASE}spec/` },
  { id: "internals", label: "Internals", href: `${BASE}internals/` },
];
