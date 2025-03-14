/// <reference lib="dom" />

import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();
import { describe, expect, it } from "bun:test";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { ClientMarkdown } from "../client";

// @ts-expect-error
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let markdownString = `
# Hello, world!

This is a test of the mdxlite runtime.
`;

describe("ClientMarkdown", () => {
  it("should render", async () => {
    let root = document.createElement("div");
    await act(async () => {
      createRoot(root).render(
        <ClientMarkdown>{markdownString}</ClientMarkdown>,
      );
    });

    expect(root.innerHTML).toBe(
      `<h1>Hello, world!</h1>
<p>This is a test of the mdxlite runtime.</p>`,
    );
  });
});
