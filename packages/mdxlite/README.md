# `mdxlite`

A minimal MDX runtime for constrained environments, e.g. Cloudflare Workers.

`@mdx-js/mdx` usage during runtime requires use of `eval` (`evaluate` and `evaluateSync`) in order to transform and run mdx, unfortunately not all environments allow for use of `eval` - like Cloudflare Workers.

`mdxlite` works similar to `@mdx-js/mdx`, in that you can take a string of markdown with JSX and transform it, yet does so without using `eval` or `new Function()`!

## Getting Started:

```bash
bun add mdxlite
```

### Usage:

```tsx
import { transformMarkdown } from 'mdxlite';

async function AsyncMarkdown({ children }): Promise<ReactNode> {
  return await transformMarkdown({
    markdown: children
    // You can also provide custom components here:
    components: {
      Greeting({children}) {
        return <marquee>{children}</marquee>
      }
    },
    // as well as any imports that might occur within the MDX string
    // **ALL** imports within the markdown string __must__ be provided here
    imports: {
      './foo': {
        namedExport: true,
        default: function DefaultExport() {
          return 'something';
        }
      }
    }
  });
}

async function handleRequest() {

  let markdownString = `
# Hello World!

import Foo, {namedExport} from './foo';

<Foo />

export const message = "hi there!"

{namedExport ? message : '🥷'}
`.trim();

  let body = await renderToReadableStream(
    <AsyncMarkdown>{markdownString}</AsyncMarkdown>
  )
  return new Response(
    body,
    {
      headers: {
        'Content-Type': 'text/html'
      }
    }
  );
}
```

## Credits:

This package was heavily inspired by, and uses most of the same code as the [`react-markdown`](https://www.npmjs.com/package/react-markdown) package, and generally wouldn't be possible without many packages in the [unifiedjs](https://unifiedjs.com/) ecosystem.

## Contributing:

### Building:

This library uses [`swc`](https://swc.rs/) and [`TypeScript`](https://www.typescriptlang.org/docs/) to build the source code and generate types.

To build the library, run `bun run build` from the root, or from this workspace!

### Code Quality:

#### Type Checking:

This library uses TypeScript to perform type checks, run `bun run type-check` from the root or from this workspace!

#### Linting

This library uses [BiomeJS](https://biomejs.dev/) for linting, run `bun run lint` from the root or from this workspace!

#### Tests

This library uses Bun for running unit tests, run `bun run test` from the root or from this workspace!

### Publishing:

To publish the library, run `bun run pub` from the workspace root. This will prompt you to login to npm and publish the package.

> Note: In the future, we will automate this process using GitHub Actions. And also add in tooling to manage releases / changelogs!
