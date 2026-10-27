import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { PAGES, type PageName } from "@/app";

export async function render(page: PageName) {
  const { default: Page } = await PAGES[page]();
    return renderToString(
    <StrictMode>
      <Page />
    </StrictMode>,
  );
}
