import mdx from "@mdx-js/rollup";
import { defineConfig } from "vite";

import rehypeShiki from "@shikijs/rehype";
import rehypeMdxCodeProps from "rehype-mdx-code-props";
import remarkFlexibleMarkers from "remark-flexible-markers";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";

let mdxPlugin = mdx({
  remarkPlugins: [
    remarkFrontmatter,
    [remarkMdxFrontmatter, { name: "frontmatter" }],
    remarkGfm,
    remarkFlexibleMarkers,
  ],
  rehypePlugins: [
    rehypeMdxCodeProps,
    [
      rehypeShiki,
      {
        themes: {
          light: "vitesse-light",
          dark: "vitesse-dark",
        },
      },
    ],
  ],
  providerImportSource: "#utils/mdx-components",
});

export default defineConfig({
  resolve: {
    alias: {
      "#utils/*": "./src/utils/*",
    },
  },
  plugins: [mdxPlugin],
});
