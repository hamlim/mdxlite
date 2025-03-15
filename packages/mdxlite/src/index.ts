import type { Root } from "hast";
import type { ReactNode } from "react";
import { createFile, createProcessor, post } from "./core";
import type { Options } from "./types";

export async function transformMarkdown(options: Options): Promise<ReactNode> {
  let processor = createProcessor(options);
  let file = createFile(options);
  let tree = await processor.run(processor.parse(file), file);
  return post(tree as Root, options);
}
