import type { Expression, Program } from "estree";
import { visit as estreeVisit } from "estree-util-visit";
import type { Root } from "hast";
import { type Evaluater, toJsxRuntime } from "hast-util-to-jsx-runtime";
import { urlAttributes } from "html-url-attributes";
import type { ReactElement } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import type { Options as RemarkRehypeOptions } from "remark-rehype";
import Sval from "sval";
import type { PluggableList, Processor } from "unified";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import type { BuildVisitor } from "unist-util-visit";
import { VFile } from "vfile";
import type { Components, ModuleLike, Options } from "./types";

let emptyPlugins: Array<PluggableList> = [];
let emptyRemarkRehypeOptions: Readonly<RemarkRehypeOptions> = {
  allowDangerousHtml: true,
  passThrough: [
    "mdxjsEsm",
    "mdxFlowExpression",
    "mdxJsxFlowElement",
    "mdxJsxTextElement",
    "mdxTextExpression",
  ],
};
let defaultRemarkPlugins = [remarkMdx];

export function createProcessor(
  options: Options,
): Processor<Root, Root, Root, undefined, undefined> {
  let rehypePlugins = options.rehypePlugins || emptyPlugins;
  let remarkPlugins = [
    ...(options.remarkPlugins || emptyPlugins),
    ...defaultRemarkPlugins,
  ];
  let remarkRehypeOptions = options.remarkRehypeOptions
    ? {
        ...options.remarkRehypeOptions,
        ...emptyRemarkRehypeOptions,
        passThrough: [
          ...(options.remarkRehypeOptions.passThrough || []),
          // @ts-expect-error: passThrough is an array, so it's spreadable
          ...emptyRemarkRehypeOptions.passThrough,
        ],
      }
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

function createEvaluater({
  imports,
  components,
}: Partial<Options> = {}): Evaluater {
  let interpreter = new Sval({
    sandBox: true,
    sourceType: "module",
  });
  if (typeof imports !== "undefined") {
    interpreter.import(imports);
  }
  // major hack:
  // essentially we're adding the custom components to the module scope
  if (typeof components !== "undefined" && components !== null) {
    interpreter.import({
      "./__secret_do_not_use_in_real_code_pls": {
        ...components,
      },
    });
    let script = `import { ${Object.keys(components).join(", ")} } from "./__secret_do_not_use_in_real_code_pls";`;
    interpreter.run(script);
  }
  let id = 0;
  return {
    evaluateExpression(expression: Expression) {
      let exportName = `_evaluateExpressionValue_${id++}`;
      let program = {
        type: "Program",
        start: 0,
        end: 41,
        body: [
          {
            type: "ExportNamedDeclaration",
            start: 0,
            end: 41,
            declaration: {
              type: "VariableDeclaration",
              start: 7,
              end: 41,
              declarations: [
                {
                  type: "VariableDeclarator",
                  start: 11,
                  end: 41,
                  id: {
                    type: "Identifier",
                    start: 11,
                    end: 35,
                    name: exportName,
                  },
                  init: expression,
                },
              ],
              kind: "let",
            },
            specifiers: [],
            source: null,
          },
        ],
        sourceType: "module",
      };

      interpreter.run(program);
      const value = interpreter.exports[exportName];
      return value;
    },
    evaluateProgram(program: Program) {
      estreeVisit(program, (node, key, index, parents) => {
        // Sval doesn’t support exports yet.
        // so we hoist the exported declarations to the parent scope.
        // e.g. `export const a = 1` becomes `const a = 1;`
        if (node.type === "ExportNamedDeclaration" && node.declaration) {
          const parent = parents[parents.length - 1];
          // @ts-expect-error: key should always be a string here
          parent[key][index] = node.declaration;
        }
      });

      // @ts-expect-error: note: `sval` types are wrong, programs are nodes.
      interpreter.run(program);
    },
  };
}

export function post(tree: Root, options: Options): ReactElement {
  let allowedElements = options.allowedElements;
  let allowElement = options.allowElement;
  let components = options.components;
  let disallowedElements = options.disallowedElements;
  let skipHtml = options.skipHtml;
  let unwrapDisallowed = options.unwrapDisallowed;
  let urlTransform = options.urlTransform || defaultUrlTransform;
  let evaluater = createEvaluater(options);

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
    createEvaluater() {
      return evaluater;
    },
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
