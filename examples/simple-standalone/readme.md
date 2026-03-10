# Vavite Simple Standalone example

Simplest example that shows how to create a simple `node:http` server.

> [Try on StackBlitz](https://stackblitz.com/github/cyco130/vavite/tree/main/examples/simple-standalone)

Clone with:

```bash
npx degit cyco130/vavite/examples/simple-standalone
```

## Note for Vite 8 Beta users

If you're using Vite 8 beta and experiencing some problems ("'module' not defined"), add the following plugin to your Vite config.

```ts
const forceEsmOxcRuntime = {
  name: "force-esm-oxc-runtime",
  enforce: "pre",
  resolveId: {
    filter: {
      id: /^@oxc-project\/runtime/,
    },
    order: "pre",
    async handler(source, importer, options) {
      if (!source.startsWith("@oxc-project/runtime")) {
        return;
      }

      const resolved = await this.resolve(source, importer, {
        ...options,
        skipSelf: true,
      });

      if (!resolved) {
        return null;
      }

      if (!resolved.id.includes("/esm/")) {
        resolved.id = resolved.id.replace("/helpers/", "/helpers/esm/");
      }

      return resolved;
    },
  },
};
```

This seems to be an issue with the oxc runtime that needs more investigation.
