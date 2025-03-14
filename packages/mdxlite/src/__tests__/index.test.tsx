import { describe, expect, it } from "bun:test";
import { renderToReadableStream } from "react-dom/server";
import { AsyncMarkdown } from "../index";

let markdownString = `
# Hello, world!

This is a test of the mdxlite runtime.
`;

describe("AsyncMarkdown", () => {
  it("should render", async () => {
    const stream = await renderToReadableStream(
      <AsyncMarkdown>{markdownString}</AsyncMarkdown>,
    );
    let resp = new Response(stream);

    expect(await resp.text()).toBe(
      `<h1>Hello, world!</h1>
<p>This is a test of the mdxlite runtime.</p>`,
    );
  });
});
