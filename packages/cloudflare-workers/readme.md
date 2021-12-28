# @vavite/cloudflare-workers

This is the Cloudflare Workers adapter for [`vavite`](https://github.com/cyco130/vavite).

## Usage

Install as a dev dependency and add it to your Vite config like this:

```ts
import { defineConfig } from "vite";
import vavite from "vavite";
import cfw from "@vavite/cloudflare-workers";

export default defineConfig({
  plugins: [ vavite(), cfw() ],
});
```

Then create a `wrangler.toml` like this:

```toml
compatibility_date = "2021-11-01"
compatibility_flags = []
name = "<YOUR PROJECT'S NAME>"
route = ''
site = {bucket = "dist/bundled/static", entry-point = "dist/bundled"}
type = "javascript"
usage_model = ''
workers_dev = true
zone_id = ''

[build]
command = "npx vite build"

[build.upload]
format = "service-worker"
```

Now you can build and test your worker locally with `miniflare dist/bundled/index.js` and deploy with `wrangler deploy`.

## Implementation notes

This adapter will build the client in `dist/bundled//static` and the server in `dist/unbundled`. It will then bundle the server entry into `dist/bundled/index.js`.

`IncomingRequest.raw` is the `FetchEvent` object and the raw response will be interpreted as a `Resonse` object.

This adapter fully supports streaming requests and responses.
