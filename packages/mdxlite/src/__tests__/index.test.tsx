import { describe, expect, it } from "bun:test";
import { renderToReadableStream } from "react-dom/server";
import { transformMarkdown } from "../index";

let markdownString = `
# Hello, world!

This is a test of the mdxlite runtime.
`;

describe("transformMarkdown", () => {
  it("should render", async () => {
    function AsyncMarkdown({ children }: { children: string }) {
      return transformMarkdown({
        markdown: children,
      });
    }
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
