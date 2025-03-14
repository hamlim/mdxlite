"use client";

import type { Root } from "hast";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createFile, createProcessor, post } from "./core";
import type { Options } from "./types";

export function ClientMarkdown(
  options: Options & { fallback?: ReactNode },
): ReactNode {
  const processor = createProcessor(options);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [tree, setTree] = useState<Root | undefined>(undefined);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    let cancelled = false;
    const file = createFile(options);

    processor.run(
      processor.parse(file),
      file,
      (error: Error | undefined, tree: Root | undefined) => {
        if (!cancelled) {
          setError(error);
          setTree(tree);
        }
      },
    );

    return (): void => {
      cancelled = true;
    };
  }, [
    processor.parse,
    options.children,
    options.rehypePlugins,
    options.remarkPlugins,
    options.remarkRehypeOptions,
  ]);

  if (error) throw error;

  return tree ? post(tree, options) : options.fallback;
}
