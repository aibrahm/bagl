import { Shell } from "@/components/shell";
import { BagelMark } from "@/components/logo";
import { ButtonLink } from "@/components/ui/button";
import { BASE } from "@/lib/site";

export default function Missing() {
  return (
    <Shell page="missing">
      <main id="main" className="mx-auto flex min-h-[60dvh] max-w-[40rem] flex-col items-start justify-center gap-6 px-4 py-20 sm:px-6">
        <BagelMark className="size-24" />
        <h1 className="text-display leading-tight">There is no page at this address.</h1>
        <p className="m-0 leading-relaxed">The link may be old, or the address may have a typo. The pages below are the ones most people look for.</p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={BASE}>Home</ButtonLink>
          <ButtonLink href={`${BASE}reference/`} variant="outline">Documentation</ButtonLink>
          <ButtonLink href={`${BASE}playground/`} variant="accent">Playground</ButtonLink>
        </div>
      </main>
    </Shell>
  );
}
