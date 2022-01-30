# @vavite/connect

`@vavite/connect` is a [Vite](https://vitejs.dev) plugin for developing and building server-side Node.js applications in the form of a [Connect](https://github.com/senchalabs/connect)-compatible middleware function `(req, res, next)`. For development, the middleware is plugged into Vite's development server. For production, `@vavite/connect` can build a standalone server or you can provide a custom server entry, optionally processed with Vite so that you can use Vite-specific features such as `import.meta.env`. `@vavite/connect` does _not_ support custom servers during development, check out the experimental [`@vavite/reloader`](../reloader) package for that use case.

## Installation and usage

Install `vite` and `@vavite/connect` as development dependencies (`npm install --save-dev vite @vavite/connect`) and add `@vavite/connect` to your Vite config:

```ts
import { defineConfig } from "vite";
import vaviteConnect from "@vavite/connect";

export default defineConfig({
  plugins: [
    vaviteConnect({
      // Options
      // ...
    }),
  ],
});
```

Then create an `index.ts` file in the root of your project that default exports a function that takes `(req, res, next)` and handles the request. For example:

```ts
import type { IncomingMessage, ServerResponse } from "http";
import type { SirvOptions } from "@vavite/connect";

export default function handler(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
) {
  if (req.url === "/") {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
	// This isn't Express but plain http.Server
	// res.send() is not available, use res.write() and res.end()
    res.end("<h1>Hello, world!</h1>");
  } else {
    next();
  }
}

export const sirvOptions: SirvOptions = {
  // sirv options, optional, see below.
};
```

Now you can start the development server with `npx vite` and visit `http://localhost:3000/` to see the result.

You can safely ignore the Vite warning about the missing client entry point that looks like this:

> (!) Could not auto-determine entry point from rollupOptions or html files and there are no explicit optimizeDeps.include patterns. Skipping dependency pre-bundling.

You can build a standalone application with the entry point in `dist/index.js` with `npx vite build --ssr`. The application will listen to the host and port specified in the `HOST` and `PORT` environment variables, or `localhost:3000` by default.

## Options

### `handlerEntry: string = "/index"`

Handler entry module. The default value `"/index"` will resolve to `index.js`, `index.ts` etc. in your project root.

### `serveClientAssetsInDev: boolean = false`

Whether to serve client assets in development mode. Enable when developing full-stack applications.

> TODO: Currently HTML files are _not_ served regardless of this setting. An option to enable it is being considered.

### `standalone: boolean = true`

Whether to build a standalone application or a Connect-compatible middleware function to be used with a custom server.

### `clientAssetsDir: string | null = null`

Directory that contains client assets to be served using the [`sirv`](https://github.com/lukeed/sirv) package. Set to `null` to exclude `sirv` from the build, either when developing backend-only applications or because you want to handle static assets yourself (using a reverse proxy, for instance). Your can export `sirvOptions` from your handler entry to customize the options. The types for the options are exported from `@vavite/connect` as `SirvOptions` so you don't have to install `sirv` yourself.

### `bundleSirv: boolean = true`

Whether `sirv` should be bundled with the application or simply be imported. You must install `sirv` as a production dependency if you set this to `false`.

## Custom server entry

> Reminder: This section applies to production build only. `@vavite/connect` does _not_ support custom servers during development, check out the experimental [`@vavite/reloader`](../reloader) package for that use case.

You can provide a custom server for production with or without processing it with Vite. In this case, you will import the handler in the appropriate way (see below) and add it to your application as a middleware function. For example, in Express it would be something like `app.use(handler)`.

For a custom server entry processed with Vite, build your application with `npx vite build --ssr server.js` where `server.js` is your custom server entry. You can import the handler with `import handler from "@vavite/connect/handler"`. A direct import also works but this takes care of injecting `sirv` if configured to do so. The `standalone` option has no effect when using a custom server entry like this.

If you don't want to process your custom server with Vite -maybe because you have an existing application with separate tooling- you should set `standalone` to `false` and import the handler from `./dist/index.js` (or whatever your build output path is).

## Examples

- [Standalone](../../examples/connect-standalone)
- [Custom server, processed with Vite](../../examples/connect-custom-server)
- [Custom server, not processed with Vite](../../examples/connect-external-server)
