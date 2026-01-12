import type { Element, Parents } from "hast";
import type { Evaluater } from "hast-util-to-jsx-runtime";
import type { ComponentType } from "react";
import type { JSX } from "react/jsx-runtime";
import type { Options as RemarkRehypeOptions } from "remark-rehype";
import type { PluggableList } from "unified";

export type UrlTransform = (
  url: string,
  key: string,
  node: Readonly<Element>,
) => string | null | undefined;

export type AllowElement = (
  element: Readonly<Element>,
  index: number,
  parent: Readonly<Parents> | undefined,
) => boolean | null | undefined;

export type ExtraProps = {
  node?: Element;
};

export type Components = {
  [Key in
    | keyof JSX.IntrinsicElements
    | string]: Key extends keyof JSX.IntrinsicElements
    ?
        | ComponentType<JSX.IntrinsicElements[Key] & ExtraProps>
        | keyof JSX.IntrinsicElements
    : ComponentType<any> | keyof JSX.IntrinsicElements;
};

// Can be a "module" (e.g. object with default, or named export keys), or just a value
export type ModuleValue = any;

export type ModuleLike =
  | ModuleValue
  | (() => ModuleValue)
  | (() => Promise<ModuleValue>)
  | Promise<ModuleValue>;

export type Options = {
  /** Markdown. */
  markdown?: string | null | undefined;
  /** Map tag names to components. */
  components?: Components | null | undefined;
  /** Mappings of import sources to modules */
  imports?: Record<string, ModuleLike>;
  /** Filter elements (optional); `allowedElements` / `disallowedElements` is used first. */
  allowElement?: AllowElement | null | undefined;
  /** Tag names to allow (default: all tag names); cannot combine w/ `disallowedElements`. */
  allowedElements?: ReadonlyArray<string> | null | undefined;
  /** Tag names to disallow (default: `[]`); cannot combine w/ `allowedElements`. */
  disallowedElements?: ReadonlyArray<string> | null | undefined;
  /** List of rehype plugins to use. */
  rehypePlugins?: PluggableList | null | undefined;
  /** List of remark plugins to use. */
  remarkPlugins?: PluggableList | null | undefined;
  /** Options to pass through to `remark-rehype`. */
  remarkRehypeOptions?: Readonly<RemarkRehypeOptions> | null | undefined;
  /** Ignore HTML in markdown completely (default: `false`). */
  skipHtml?: boolean | null | undefined;
  /**
   * Extract (unwrap) what's in disallowed elements (default: `false`);
   * normally when say `strong` is not allowed, it and it's children are dropped,
   * with `unwrapDisallowed` the element itself is replaced by its children.
   */
  unwrapDisallowed?: boolean | null | undefined;
  /** Change URLs (default: `defaultUrlTransform`) */
  urlTransform?: UrlTransform | null | undefined;
};
