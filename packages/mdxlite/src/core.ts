import type { Root } from "hast";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { urlAttributes } from "html-url-attributes";
import type { ReactElement } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import type { Options as RemarkRehypeOptions } from "remark-rehype";
import type { PluggableList, Processor } from "unified";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import type { BuildVisitor } from "unist-util-visit";
import { VFile } from "vfile";
import type { Options } from "./types";

let emptyPlugins: Array<PluggableList> = [];
let emptyRemarkRehypeOptions: Readonly<RemarkRehypeOptions> = {
  allowDangerousHtml: true,
};

export function createProcessor(
  options: Options,
): Processor<Root, Root, Root, undefined, undefined> {
  let rehypePlugins = options.rehypePlugins || emptyPlugins;
  let remarkPlugins = options.remarkPlugins || emptyPlugins;
  let remarkRehypeOptions = options.remarkRehypeOptions
    ? { ...options.remarkRehypeOptions, ...emptyRemarkRehypeOptions }
    : emptyRemarkRehypeOptions;

  let processor = unified()
    .use(remarkParse)
    .use(...remarkPlugins.flat())
    .use(remarkRehype, remarkRehypeOptions)
    .use(...rehypePlugins.flat());

  return processor as Processor<Root, Root, Root, undefined, undefined>;
}

export function createFile(options: Options): VFile {
  let markdown = options.markdown || "";
  let file = new VFile();

  if (typeof markdown === "string") {
    file.value = markdown;
  } else {
    throw new Error(
      `Unexpected value \`${markdown}\` for \`markdown\` prop, expected \`string\``,
    );
  }

  return file;
}

let safeProtocol = /^(https?|ircs?|mailto|xmpp)$/i;

export function defaultUrlTransform(value: string): string | undefined | null {
  // Same as:
  // <https://github.com/micromark/micromark/blob/929275e/packages/micromark-util-sanitize-uri/dev/index.js#L34>
  // But without the `encode` part.
  let colon = value.indexOf(":");
  let questionMark = value.indexOf("?");
  let numberSign = value.indexOf("#");
  let slash = value.indexOf("/");

  if (
    // If there is no protocol, it’s relative.
    colon === -1 ||
    // If the first colon is after a `?`, `#`, or `/`, it’s not a protocol.
    (slash !== -1 && colon > slash) ||
    (questionMark !== -1 && colon > questionMark) ||
    (numberSign !== -1 && colon > numberSign) ||
    // It is a protocol, it should be allowed.
    safeProtocol.test(value.slice(0, colon))
  ) {
    return value;
  }

  return "";
}

export function post(tree: Root, options: Options): ReactElement {
  let allowedElements = options.allowedElements;
  let allowElement = options.allowElement;
  let components = options.components;
  let disallowedElements = options.disallowedElements;
  let skipHtml = options.skipHtml;
  let unwrapDisallowed = options.unwrapDisallowed;
  let urlTransform = options.urlTransform || defaultUrlTransform;

  if (allowedElements && disallowedElements) {
    throw new Error(
      "Unexpected combined `allowedElements` and `disallowedElements`, expected one or the other",
    );
  }

  visit(tree, transform);

  return toJsxRuntime(tree, {
    Fragment,
    components,
    ignoreInvalidStyle: true,
    jsx,
    jsxs,
    passKeys: true,
    passNode: true,
  });

  type TransformParams = Parameters<BuildVisitor<Root>>;
  function transform(
    node: TransformParams[0],
    index: TransformParams[1],
    parent: TransformParams[2],
  ): ReturnType<BuildVisitor<Root>> {
    if (node.type === "raw" && parent && typeof index === "number") {
      if (skipHtml) {
        parent.children.splice(index, 1);
      } else {
        parent.children[index] = { type: "text", value: node.value };
      }

      return index;
    }

    if (node.type === "element") {
      let key: string;

      for (key in urlAttributes) {
        if (
          Object.hasOwn(urlAttributes, key) &&
          Object.hasOwn(node.properties, key)
        ) {
          let value = node.properties[key];
          let test = urlAttributes[key];
          if (test === null || test.includes(node.tagName)) {
            node.properties[key] = urlTransform(String(value || ""), key, node);
          }
        }
      }
    }

    if (node.type === "element") {
      let remove = allowedElements
        ? !allowedElements.includes(node.tagName)
        : disallowedElements
          ? disallowedElements.includes(node.tagName)
          : false;

      if (!remove && allowElement && typeof index === "number") {
        remove = !allowElement(node, index, parent);
      }

      if (remove && parent && typeof index === "number") {
        if (unwrapDisallowed && node.children) {
          parent.children.splice(index, 1, ...node.children);
        } else {
          parent.children.splice(index, 1);
        }

        return index;
      }
    }
  }
}
