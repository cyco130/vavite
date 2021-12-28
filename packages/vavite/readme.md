# Va vite!

`vavite` is a Vite plugin that provides SSR functionality that is environment, cloud, framework, and meta-framework agnostic. It achieves this by means of “environment adapters” that convert the request representation of their specific environment into an environment-agnostic representation, calls your request handler, and converts the environment-agnostic response representation returned from your handler into whatever the specific environment expects. It also provides escape hatches for direct handling of the environment-specific request or the response.

Adapters for Vite's development server and Node.js are built in. [`@vavite/cloudflare-workers`](https://github.com/cyco130/vavite/blob/main/packages/cloudflare-workers), [`@vavite/netlify`](https://github.com/cyco130/vavite/blob/main/packages/netlify), and [`@vavite/vercel`](https://github.com/cyco130/vavite/blob/main/packages/vercel) packages provide adapters for Cloudflare Workers, Netlify Functions, and Vercel respectively.

## Usage

Install as a dev dependency and add it to your Vite config like this:

```ts
import { defineConfig } from "vite";
import vavite from "vavite";

export default defineConfig({
  plugins: [ vavite() ],
});
```

Now, when you run `vite dev`, it will look for a `handler.js` (or `.ts`, or any other extension specified `resolve.extensions`) in your project root. You can change the default with `vavite({ handlerEntry: "my-handler.ts" })`. The handler file is supposed to default export a request handler that receives an `IncomingRequest` and return an `OutgoingResponse` (or a promise of one).

When you build with `vite build`, it will first build a client bundle, then the server-side code. If you don't use any adapters, the build will create a `dist/server/index.js` which is a Node.js server. You can use `vavite({ serverEntry: "vavite/no-sirv" })` to omit bundling [`sirv`](https://github.com/lukeed/sirv) which is used for serving static files (because your reverse proxy already does it, for instance). You can also use `vavite/middleware` to build a connect-style middleware instead of a full application.

If you're using an adapter, the dev server works the same way while the build will create a bundle suitable for the target environment.

## Accessing client build artifacts

Your server-side code can access the manifests from the client build by importing them via `vavite/manifest` and `vavite/ssr-manifest`. In dev mode, the SSR manifest will be an empty object while the client manifest will be a special proxy object that maps each file to itself.

You can also access the content of `index.html` (if it exists) in its processed form by importing `vavite/html`. In dev, it will return the unprocessed `index.html`: vavite will call `transformIndexHtml` for you if your response's content type is `text/html`.

When authoring an adapter or a custom entry, user's handler module is accessible via `vavite/handler`.

## Request and response formats

The canonical request object passed to the handler function looks like this:

```ts
export interface IncomingRequest {
  /** Environment specific request representation as an escape hatch */
  raw: any;
  /** IP address of the end user */
  ip: string;
  /** URL of the current request */
  url: URL;
  /** HTTP method */
  method: string;
  /** Request headers */
  headers: Record<string, string | undefined>;
  /** Request body */
  body: RequestBody;
}
```

The `RequestBody` supports streaming reads where available and looks like this:

```ts
export interface RequestBody {
  /** Read all as a UTF-8 encoded string */
  text(): Promise<string>;
  /** Read all as a an array of bytes */
  binary(): Promise<Uint8Array>;
  /** A stream of bytes */
  stream(): AsyncGenerator<Uint8Array>;
}
```

The response object looks like this:

```ts
export interface OutgoingResponse {
  /** HTTP status code */
  status?: number;
  /** Response headers */
  headers?: Record<string, undefined | string | string[]>;
  /** Response body */
  body?: ResponseBody;
}
```

The response body also supports streaming where available and can be any of the following:

```ts
export type ResponseBody =
  // Empty body
  | undefined
  | null
  // UTF-8 encoded string
  | string
  // Array of bytes
  | Uint8Array
  // A stream of bytes
  | AsyncGenerator<Uint8Array>
  // A stream of UTF-8 encoded strings
  | AsyncGenerator<string>;
```

The response can also be in the form of `{ raw: ... }`. If it is, it will be passed as a raw response to the environment adapter.

Your handler can also return `undefined` or a promise that resolves to `undefined` to signal that it didn't handle the request. If you're using a middleware adapter, it will pass the request to the next middleware; otherwise a generic 404 response will be returned.

## Raw request and response for built-in adapters

The built-in adapters pass `{ req: http.IncomingRequest, res: ServerResponse }` in `IncognitoRequest.raw`. The raw response value will not be used but if you return `{ raw: any }` as the response, vavite will assume that you already handled the response using `request.raw.res.end()`.

## Package exports

| Entry                 | Description                                          |
| --------------------- | ---------------------------------------------------- |
| `vavite`              | Vite plugin and types                                |
| `vavite/entry`        | Entry point for Node HTTP server with `sirv` bundled |
| `vavite/no-sirv`      | Entry point for Node HTTP server without `sirv`      |
| `vavite/middleware`   | Entry point for connect-like middleware (no `sirv`)  |
| `vavite/handler`      | Resolves to the user's handler entry                 |
| `vavite/manifest`     | Vite manifest                                        |
| `vavite/ssr-manifest` | Vite SSR manifest                                    |
| `vavite/html`         | Contents of `index.html`                             |

## Adapter authoring check-list

You can use the testbed project in the repo. Run `CI=1 TEST_HOST="<YOUR HOST>" pnpx vitest` to run the end-to-end tests in the `e2e.test.ts` file.

1. Make sure it doesn't break the dev command when your adapter plugin is active by running `pnpm dev` and testing with `CI=1 TEST_HOST="localhost:3000" pnpx vitest` on a different terminal.
2. Deploy to your adapter's target environment and run the end-to-end tests again on the deployed URL.
3. Manually check the pages `/` and `/react` that the button is purple and is incrementing the counter (TODO: Write an automatic test for this).
4. If your target environment supports streaming responses, run `curl -ND - '<YOUR HOST>/bin-stream?delay=50'` and observe the typewriter effect.
