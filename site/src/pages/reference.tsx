import toc from "virtual:toc";
import { DocPage } from "@/components/doc-page";
import Content from "@/content/reference.mdx";

export default function ReferencePage() {
  return <DocPage page="reference" toc={toc.reference} Content={Content} />;
}
