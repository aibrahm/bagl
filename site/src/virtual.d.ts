/// <reference types="mdx" />
declare module "virtual:toc" {
  export type TocEntry = { id: string; text: string; depth: number };
  const toc: Record<"start" | "reference" | "internals" | "spec", TocEntry[]>;
  export default toc;
}
declare module "*.md" {
  import type { ComponentType } from "react";
  import type { MDXComponents } from "mdx/types";
  const Content: ComponentType<{ components?: MDXComponents }>;
  export default Content;
}
