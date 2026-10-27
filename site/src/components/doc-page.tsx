import { useEffect, useState, type ComponentType } from "react";
import type { MDXComponents } from "mdx/types";
import { Shell } from "@/components/shell";
import { StaticCode } from "@/components/static-code";
import { Example } from "@/components/example";
import { Sidebar, type SidebarSection } from "@/components/ui/sidebar";
import type { PageId } from "@/lib/site";
import type { TocEntry } from "virtual:toc";

// A Markdown page with its sections in a sidebar. The sidebar marks the
// section you are reading, using the heading closest above a line 30% down the window.

function Pre(props: React.ComponentProps<"pre">) {
  const child = props.children as { props?: { className?: string; children?: string } } | undefined;
  const lang = child?.props?.className ?? "";
  const text = typeof child?.props?.children === "string" ? child.props.children.replace(/\n$/, "") : null;
  if (text !== null && lang.includes("language-bagl")) {
    return (
      <div className="code-surface overflow-clip rounded-sm">
        <StaticCode source={text} className="text-[0.875rem]" />
      </div>
    );
  }
  return <pre {...props} />;
}

function A({ href = "", ...props }: React.ComponentProps<"a">) {
  const external = /^https?:\/\//.test(href);
  return <a href={href} {...props} {...(external ? { rel: "noopener" } : {})} />;
}

const components: MDXComponents = { Example, pre: Pre, a: A };

export function toSections(toc: TocEntry[]): SidebarSection[] {
  const items: SidebarSection["items"] = [];
  for (const h of toc) {
    if (h.depth === 2) items.push({ id: h.id, label: h.text, href: `#${h.id}`, children: [] });
    else if (h.depth === 3 && items.length) items[items.length - 1].children!.push({ id: h.id, label: h.text, href: `#${h.id}` });
  }
  return [{ items }];
}

function useCurrentSection(toc: TocEntry[]) {
  const [active, setActive] = useState(toc.find((t) => t.depth === 2)?.id ?? "");
  useEffect(() => {
    const heads = toc.filter((t) => t.depth === 2 || t.depth === 3).map((t) => document.getElementById(t.id)).filter((h): h is HTMLElement => !!h);
    let frame = 0;
    const update = () => {
      const line = innerHeight * 0.3;
      let current = heads[0];
      for (const h of heads) if (h.getBoundingClientRect().top <= line) current = h;
      if (current) setActive(current.id);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => removeEventListener("scroll", onScroll);
  }, [toc]);
  return active;
}

export function DocPage({ page, toc, Content, collapse = false, intro }: { page: PageId; toc: TocEntry[]; Content: ComponentType<{ components?: MDXComponents }>; collapse?: boolean; intro?: React.ReactNode }) {
  const sections = toSections(toc);
  const active = useCurrentSection(toc);
  return (
    <Shell page={page} sections={sections} activeId={active}>
      <div className="mx-auto grid max-w-[78rem] gap-x-12 px-4 sm:px-6 lg:grid-cols-[15rem_minmax(0,46rem)]">
        <Sidebar sections={sections} activeId={active} label="Sections" collapse={collapse} className="sticky top-[calc(var(--header-h)+1px)] max-h-[calc(100dvh-var(--header-h)-1px)] self-start overflow-y-auto overscroll-contain py-6 [scrollbar-width:thin]" />
        <main id="main" className="prose min-w-0 pb-24 pt-10">
          {intro}
          <Content components={components} />
        </main>
      </div>
    </Shell>
  );
}
