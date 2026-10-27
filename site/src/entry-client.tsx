import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { PAGES, type PageName } from "@/app";
import "@/styles.css";

const root = document.getElementById("root")!;
const name = (root.dataset.page as PageName) in PAGES ? (root.dataset.page as PageName) : "missing";

const { default: Page } = await PAGES[name]();
const app = (
  <StrictMode>
    <Page />
  </StrictMode>
);
// The build fills #root with the server render; the dev server leaves it empty.
if (root.firstElementChild) hydrateRoot(root, app);
else createRoot(root).render(app);
