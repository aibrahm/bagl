import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

// Light or dark. The choice is stored under the same key as on
// abdelrahmanibrm.com, so the copy of these pages served there follows the site.
type Theme = "light" | "dark";

function current(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => setTheme(current()), []);

  const flip = () => {
    const next: Theme = current() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* storage blocked: the choice lasts for this page only */
    }
    setTheme(next);
  };

  const label = theme === "dark" ? "Use the light theme" : "Use the dark theme";
  return (
    <button type="button" onClick={flip} aria-label={label} title={label} className="grid size-10 flex-none place-items-center rounded-sm text-text hover:bg-line-soft active:opacity-70">
      {theme === "dark" ? <Sun aria-hidden className="size-[18px]" /> : <Moon aria-hidden className="size-[18px]" />}
    </button>
  );
}
