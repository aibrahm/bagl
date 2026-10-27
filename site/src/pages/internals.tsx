import toc from "virtual:toc";
import { DocPage } from "@/components/doc-page";
import Content from "../../../docs/internals.md";

export default function InternalsPage() {
  return <DocPage page="internals" toc={toc.internals} Content={Content} />;
}
