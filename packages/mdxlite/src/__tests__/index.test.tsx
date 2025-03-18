import { describe, expect, it } from "bun:test";
import { renderToReadableStream } from "react-dom/server";
import { transformMarkdown } from "../index";

describe("transformMarkdown", () => {
  it("should render simple markdown", async () => {
    let markdownString = `
    # Hello, world!
    
    This is a test of the mdxlite runtime.
    `;
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

  it("should render mdx with imports", async () => {
    let mdxString = `
import {Foo} from './bar';
import {Baz} from 'qux';

<Foo />
<Baz />
`;
    function AsyncMarkdown({ children }: { children: string }) {
      return transformMarkdown({
        markdown: children,
        imports: {
          "./bar": {
            Foo() {
              return <span>foo from bar!</span>;
            },
          },
          qux: {
            Baz() {
              return <span>baz from qux!</span>;
            },
          },
        },
      });
    }
    const stream = await renderToReadableStream(
      <AsyncMarkdown>{mdxString}</AsyncMarkdown>,
    );
    let resp = new Response(stream);

    expect(await resp.text()).toBe(
      `
<span>foo from bar!</span>
<span>baz from qux!</span>`,
    );
  });

  it("should render mdx with inline expressions", async () => {
    let mdxString = `4+5: {4+5}`;
    function AsyncMarkdown({ children }: { children: string }) {
      return transformMarkdown({
        markdown: children,
      });
    }
    const stream = await renderToReadableStream(
      <AsyncMarkdown>{mdxString}</AsyncMarkdown>,
    );
    let resp = new Response(stream);

    expect(await resp.text()).toBe(`<p>4+5: <!-- -->9</p>`);
  });

  it("should render mdx with inline export values", async () => {
    let mdxString = `
export const foo = 'bar';

foo is: {foo}
`;
    function AsyncMarkdown({ children }: { children: string }) {
      return transformMarkdown({
        markdown: children,
      });
    }
    const stream = await renderToReadableStream(
      <AsyncMarkdown>{mdxString}</AsyncMarkdown>,
    );
    let resp = new Response(stream);

    expect(await resp.text()).toBe(`
<p>foo is: <!-- -->bar</p>`);
  });

  it("should render complex mdx", async () => {
    let markdownString = `
# Hello World!

import Foo, {namedExport} from './foo';

<Foo />

export const message = "hi there!"

<Greeting>{namedExport ? message : '🥷'}</Greeting>
`.trim();
    function AsyncMarkdown({ children }: { children: string }) {
      return transformMarkdown({
        markdown: children,
        components: {
          Greeting({ children }) {
            // @ts-expect-error: <explanation>
            // biome-ignore lint/a11y/noDistractingElements: <explanation>
            return <marquee>{children}</marquee>;
          },
        },
        // as well as any imports that might occur within the MDX string
        // **ALL** imports within the markdown string __must__ be provided here
        imports: {
          "./foo": {
            namedExport: true,
            default: function DefaultExport() {
              return "something";
            },
          },
        },
      });
    }
    const stream = await renderToReadableStream(
      <AsyncMarkdown>{markdownString}</AsyncMarkdown>,
    );
    let resp = new Response(stream);

    expect(await resp.text()).toBe(`<h1>Hello World!</h1>
<!-- -->
<!-- -->something<!-- -->
<!-- -->
<marquee>hi there!</marquee>`);
  });
});
