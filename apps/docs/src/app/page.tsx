import shell from "@shikijs/langs/shell";
import ts from "@shikijs/langs/typescript";
import vitesseDark from "@shikijs/themes/vitesse-dark";
import vitesseLight from "@shikijs/themes/vitesse-light";
import { transformMarkdown } from "mdxlite";
import { createHighlighterCoreSync } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

const shiki = createHighlighterCoreSync({
  themes: [vitesseDark, vitesseLight],
  langs: [ts, shell],
  engine: createJavaScriptRegexEngine(),
});

function CodeBlock({ children, lang }: { children: string; lang: string }) {
  let html = shiki.codeToHtml(children, {
    lang,
    themes: {
      light: vitesseLight,
      dark: vitesseDark,
    },
  });
  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
    <div className="not-prose" dangerouslySetInnerHTML={{ __html: html }} />
  );
}

let markdown = `# \`mdxlite\`

A minimal MDX runtime for constrained environments, e.g. Cloudflare Workers.

\`@mdx-js/mdx\` runtime usage (e.g. \`evaluate\` or \`evaulateSync\`) requires use of \`eval\` in order to transform markdown to executable JS, unfortunately not all environments support that, e.g. Cloudflare Workers.

\`mdxlite\` works a bit like \`@mdx-js/mdx\` but is much simpler in that you can take a string of markdown with JSX and transforms it without using \`eval\` or \`new Function()\`.

## Getting Started:

~~~shell
bun add mdxlite
~~~

### Usage:

~~~ts
import { transformMarkdown } from "mdxlite";

let markdown = \`
  # Hello, world!
\`;

let jsxElements = await transformMarkdown({ markdown });
~~~

### Types:

The package exports a \`transformMarkdown\` function that takes an \`Options\` object.

Here are the generated types for the library:

~~~ts
import type { Element, Parents } from "hast";
import type { ComponentType } from "react";
import type { JSX } from "react/jsx-runtime";
import type { Options as RemarkRehypeOptions } from "remark-rehype";
import type { PluggableList } from "unified";

export type UrlTransform = (
  url: string,
  key: string,
  node: Readonly<Element>
) => string | null | undefined;

export type AllowElement = (
  element: Readonly<Element>,
  index: number,
  parent: Readonly<Parents> | undefined
) => boolean | null | undefined;

export type ExtraProps = { node?: Element };

export type Components = {
  [Key in keyof JSX.IntrinsicElements]? :
    ComponentType<JSX.IntrinsicElements[Key] & ExtraProps> | keyof JSX.IntrinsicElements
};

export type Options = {
  markdown?: string | null | undefined;
  // A mapping of components to use for the markdown
  // If you want to have these elements replace html / raw JSX within the markdown
  // you'll want to use the \`rehype-raw\` plugin as well
  components?: Components | null | undefined;
  allowElement?: AllowElement | null | undefined;
  allowedElements?: ReadonlyArray<string> | null | undefined;
  disallowedElements?: ReadonlyArray<string> | null | undefined;
  rehypePlugins?: PluggableList | null | undefined;
  remarkPlugins?: PluggableList | null | undefined;
  remarkRehypeOptions?: Readonly<RemarkRehypeOptions> | null | undefined;
  skipHtml?: boolean | null | undefined;
  unwrapDisallowed?: boolean | null | undefined;
  urlTransform?: UrlTransform | null | undefined;
};

export declare function transformMarkdown(
  options: Options
): Promise<ReactNode>;
~~~

## Credits:

This package was heavily inspired by, and uses most of the same code as the [\`react-markdown\`](https://www.npmjs.com/package/react-markdown) package, and generally wouldn't be possible without many packages in the [unifiedjs](https://unifiedjs.com/) ecosystem.`;

export default async function Home() {
  let content = await transformMarkdown({
    markdown,
    components: {
      pre({ children }) {
        return <pre className="not-prose">{children}</pre>;
      },
      code({ children, node }) {
        let lang: string | undefined;
        if (
          (node?.properties.className as Array<string>)?.[0]?.includes(
            "language-",
          )
        ) {
          lang = (node?.properties.className as Array<string>)[0]?.split(
            "language-",
          )[1];
          return (
            <CodeBlock lang={lang as string}>{children as string}</CodeBlock>
          );
        }
        return <code>{children}</code>;
      },
    },
  });
  return (
    <main className="prose xl:prose-lg mx-4 md:mx-auto my-12 min-h-screen">
      {content}
    </main>
  );
}
