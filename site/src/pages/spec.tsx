import toc from "virtual:toc";
import { DocPage } from "@/components/doc-page";
import Content from "../../.generated/spec.md";

export default function SpecPage() {
  return <DocPage page="spec" toc={toc.spec} Content={Content} collapse />;
}
