# Vavite Vike example with Express

Simple example of using [Vike](https://vike.dev/) with Vavite and Express that shows how to:

- Integrate Express with Vite's dev server
- Run multiple build steps (for client and server)
- Perform React SSR with Vike

> [Try on StackBlitz](https://stackblitz.com/github/cyco130/vavite/tree/main/examples/vike)

Clone with:

```bash
npx degit cyco130/vavite/examples/vike
```

> All examples have `"type": "module"` in their `package.json`.
>
> - For Vite v2, remove it to use CommonJS (CJS).
> - If you want to use CommonJS with Vite v3+, add `legacy.buildSsrCjsExternalHeuristics: true` to your Vite config.
