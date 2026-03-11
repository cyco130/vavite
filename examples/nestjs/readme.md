# Vavite NestJS example

`serverEntry` example that shows how to integrate with [NestJS](https://nestjs.com/).

Clone with:

```bash
npx degit cyco130/vavite/examples/nestjs
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
