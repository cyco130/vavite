# @vavite/netlify

This is the Netlify Functions adapter for [`vavite`](https://github.com/cyco130/vavite).

## Usage

Install as a dev dependency and add it to your Vite config like this:

```ts
import { defineConfig } from "vite";
import vavite from "vavite";
import netlify from "@vavite/netlify";

export default defineConfig({
  plugins: [ vavite(), netlify() ],
});
```

Then create a `netlify.toml` like this:

```toml
[build]
command = "npx vite build"
publish = "netlify/static"
```

After building your application with `vite build`, you can deploy with `netlify deploy`. You can also [link your git repository to Netlify](https://docs.netlify.com/configure-builds/get-started/) to automatically deploy your app when you push to your repository.

## Implementation notes

This adapter will build the client in `netlify/static` and the server in `netlify/unbundled`. It will then bundle the server entry into `netlify/functions/render.js`.

`IncomingRequest.raw` is the `NetlifyFunctionEvent` object and the raw response will be interpreted as a `NetlifyFunctionResult` object.

Netlify doesn't support streaming requests and responses: `body.stream()` will return the whole body in a single chunk and the response body will be cached before being sent in its entirety.
