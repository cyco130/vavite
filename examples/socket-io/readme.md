# Vavite socket.io example

`serverEntry` example that shows how to integrate with [socket.io](http://socket.io/).

The trick is to attach the socket.io server to `viteDevServer.httpServer` (from `"vavite/vite-dev-server"`) and not to `httpDevServer` from `"vavite/http-dev-server"`. The latter is merely a proxy to force server frameworks to behave in a controlled manner, the former is the actual server used by Vite.

> [Try on StackBlitz](https://stackblitz.com/github/cyco130/vavite/tree/main/examples/socket-io)

Clone with:

```bash
npx degit cyco130/vavite/examples/socket-io
```
