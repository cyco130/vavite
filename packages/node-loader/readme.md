# @vavite/node-loader

`@vavite/node-loader` is [Node ESM loader](https://nodejs.org/api/esm.html#loaders) that uses [Vite](https://vitejs.dev) to transpile modules. It is part of the `vavite` project but it can be used in any Vite SSR project to enable sourcemap and breakpoints support.

## Installation

```sh
npm install --save-dev @vavite/node-loader
```

## Usage

Add the following to your Vite config:

```ts
import { defineConfig } from "vite";
import { nodeLoader } from "@vavite/node-loader/plugin";

export default defineConfig({
  plugins: [
    nodeLoader(),
    // ...
  ],
});
```

And run your project with `node --experimental-loader @vavite/node-loader my-server-entry.js`.

You can add the `-r @vavite/node-loader/suppress-warning` before the loader option to suppress the warning about experimental loader.
