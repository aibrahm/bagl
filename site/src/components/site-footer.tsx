import { BagelMark } from "@/components/logo";
import { AUTHOR_PAGE, BASE, REPO } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[90rem] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] text-sm text-muted sm:px-6">
        <BagelMark small className="size-5 flex-none" />
        <p>Bagl is open source under the MIT License.</p>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 sm:ms-auto">
          <li><a className="underline-offset-4 hover:underline" href={REPO}>Source code</a></li>
          <li><a className="underline-offset-4 hover:underline" href={`${REPO}/issues`}>Report a problem</a></li>
          <li><a className="underline-offset-4 hover:underline" href={AUTHOR_PAGE}>About the project</a></li>
          <li><a className="underline-offset-4 hover:underline" href={`${BASE}reference/`}>Language reference</a></li>
        </ul>
      </div>
    </footer>
  );
}
