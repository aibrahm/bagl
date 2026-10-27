import { Play } from "lucide-react";
import { Shell } from "@/components/shell";
import { Logo } from "@/components/logo";
import { StaticCode } from "@/components/static-code";
import { ButtonLink } from "@/components/ui/button";
import { BASE, REPO } from "@/lib/site";
import examples from "@/content/examples.json";

// A program as a playground link (the playground reads #code= on load).
const playgroundLink = (source: string) => {
  const bytes = new TextEncoder().encode(source);
  const b64 = typeof btoa === "function" ? btoa(String.fromCharCode(...bytes)) : Buffer.from(bytes).toString("base64");
  return `${BASE}playground/#code=${b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;
};

function Sample({ source, output, small = false }: { source: string; output: string; small?: boolean }) {
  const size = small ? "text-[0.8125rem]" : "text-[0.875rem]";
  return (
    <div className="code-surface overflow-clip rounded-sm">
      <StaticCode source={source} className={size} />
      <div className="flex items-center gap-3 border-t border-line-soft py-1.5 ps-5 pe-1.5">
        <p className={`m-0 min-w-0 flex-1 whitespace-pre-wrap font-mono text-[var(--syn-builtin)] ${size}`}>
          <span className="sr-only">Output: </span>
          {output}
        </p>
        <a href={playgroundLink(source)} className="inline-flex h-8 flex-none items-center gap-1.5 rounded-sm px-2.5 text-sm text-muted no-underline hover:bg-line-soft hover:text-text active:opacity-70">
          <Play aria-hidden className="size-3.5" />
          Run
        </a>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    title: "Shapes in the types",
    body: "The size of each dimension is part of a tensor's type, so a product of a 2x3 and a 2x2 matrix doesn't compile.",
    example: examples.home.shapes,
  },
  {
    title: "Derivatives from the compiler",
    body: "grad turns a function into its derivative. Over tensors it uses reverse mode, which gives every partial derivative in one pass.",
    example: examples.home.grad,
  },
  {
    title: "Inferred types",
    body: "Hindley-Milner inference, as in ML and OCaml, finds every type. You annotate only to fix a tensor's rank or to ask for floats.",
    example: examples.home.inference,
  },
];

export default function Home() {
  const xor = examples.playground["train-xor"];
  return (
    <Shell page="home">
      <main id="main">
        <section className="mx-auto grid max-w-[72rem] items-center gap-10 px-4 pb-16 pt-12 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:pt-20">
          <div>
            <Logo className="w-[min(20rem,75%)]" title="Bagl" />
            <h1 className="mt-8 text-heading leading-snug">A functional language with tensor shapes in its types.</h1>
            <p className="mt-3 max-w-[34rem] text-[1.0625rem] leading-relaxed text-muted">
              Bagl checks every matrix operation at compile time, and its compiler writes derivatives for you. It is written in OCaml, and it also runs in the browser.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={`${BASE}start/`} size="lg">Get started</ButtonLink>
              <ButtonLink href={`${BASE}reference/`} variant="outline" size="lg">Documentation</ButtonLink>
              <ButtonLink href={`${BASE}playground/`} variant="accent" size="lg">Playground</ButtonLink>
            </div>
          </div>
          <Sample source={xor.source} output={xor.expect} />
        </section>

        <section aria-labelledby="features" className="border-t border-line">
          <h2 id="features" className="sr-only">Features</h2>
          <div className="mx-auto grid max-w-[72rem] gap-10 px-4 py-16 sm:px-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr))]">
            {FEATURES.map((f) => (
              <article key={f.title} className="flex flex-col gap-3">
                <h3 className="text-lg">{f.title}</h3>
                <p className="m-0 text-[0.9375rem] leading-relaxed text-muted">{f.body}</p>
                <div className="mt-auto pt-2">
                  <Sample source={f.example.source} output={f.example.expect} small />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="install" className="border-t border-line">
          <div className="mx-auto grid max-w-[72rem] gap-8 px-4 py-16 sm:px-6 md:grid-cols-2">
            <div>
              <h2 id="install" className="text-heading">Install</h2>
              <p className="mt-3 max-w-[32rem] leading-relaxed text-muted">Bagl builds from source with OCaml 5.2 and dune.</p>
              <p className="mt-3">
                <a className="text-link underline underline-offset-4" href={`${BASE}start/`}>Installation and first steps</a>
              </p>
            </div>
            <pre className="code-surface m-0 overflow-x-auto rounded-sm px-5 py-4 font-mono text-[0.9375rem] leading-[1.7]">
              {`$ git clone ${REPO}\n$ cd bagl && dune build && dune install\n$ baglc examples/train_xor.bagl`}
            </pre>
          </div>
        </section>
      </main>
    </Shell>
  );
}
