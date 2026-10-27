import toc from "virtual:toc";
import { DocPage } from "@/components/doc-page";
import Content from "@/content/start.mdx";

export default function StartPage() {
  return <DocPage page="start" toc={toc.start} Content={Content} />;
}
