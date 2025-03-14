# `mdxlite`

A minimal MDX runtime for constrained environments, e.g. Cloudflare Workers.

`@mdx-js/mdx` usage during runtime requires use of `eval` (`evaluate`, `evaluateSync`, `run`) in order to transform markdown to executable JS, unfortunately not all environments allow for use of `eval` - like Cloudflare Workers.

## Getting Started:

```bash
bun add mdxlite
```

### Usage:

```tsx
// For server side rendering:
import { AsyncMarkdown } from 'mdxlite';

// for client-only environments:
import { ClientMarkdown } from 'mdxlite/client';

async function handleRequest() {
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

This package was heavily inspired by `react-markdown`, and generally wouldn't be possible without many packages in the [unifiedjs](https://unifiedjs.com/) ecosystem.

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
