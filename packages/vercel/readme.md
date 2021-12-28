# @vavite/vercel

This is the Vercel adapter for [`vavite`](https://github.com/cyco130/vavite).

## Usage

Install as a dev dependency and add it to your Vite config like this:

```ts
import { defineConfig } from "vite";
import vavite from "vavite";
import vercel from "@vavite/vercel";

export default defineConfig({
  plugins: [ vavite(), vercel() ],
});
```

You can build and deploy your app from the CLI by running `vite build && vercel` and leaving all settings in their defaults. See Vercel's [git integration](https://vercel.com/docs/concepts/git) for continuous deployment support.

## Implementation notes

This adapter will build the client in `.output/static` and the server in `.output/unbundled`. It will then bundle the server entry into `.output/server/pages/index.js` and create configuration files `functions-manifest.json` and `routes-manifest.json` in `.output`.

This adapter will pass `{ req: http.IncomingRequest, res: ServerResponse }` in `IncognitoRequest.raw`. The raw response value will not be used but if you return `{ raw: any }` as the response, it will assume that you already handled the response using `request.raw.res.end()`.

This adapter fully supports streaming requests and responses but Vercel itself seems to have some output buffering so you might not see the typewriter effect when testing.
