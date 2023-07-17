import { renderToPipeableStream } from "react-dom/server";
// @ts-expect-error - no types
import reactStreaming from "react-streaming/server";
import { escapeInject } from "vite-plugin-ssr/server";
import type { PageContextBuiltIn } from "vite-plugin-ssr";
import type { PageContext } from "./types";

import logoUrl from "./logo.svg";
import { PageWrapper } from "./PageWrapper";

export { render };

// See https://vite-plugin-ssr.com/data-fetching
export const passToClient = ["pageProps"];

async function render(pageContext: PageContextBuiltIn & PageContext) {
	const { documentProps } = pageContext;
	const title = (documentProps && documentProps.title) || "App";
	let stream;

	if (pageContext.Page) {
		const { Page, pageProps } = pageContext;
		stream = await reactStreaming.renderToStream(
			<PageWrapper pageContext={pageContext}>
				<Page {...pageProps} />
			</PageWrapper>,
			{
				disable: false,
				webStream: false,
				renderToPipeableStream,
			},
		);
	} else {
		stream = "";
	}
	// See https://vite-plugin-ssr.com/head
	return {
		documentHtml: escapeInject`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta name="color-scheme" content="dark light" />
        <meta name="description" content="App" />
        <meta charset="UTF-8" />
        <link rel="icon" href="${logoUrl}" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
      </head>
      <body style="height: 100vh;">
        <div id="page-view" style="height: 100%; overflow: hidden;">${stream}</div>
      </body>
    </html>`,
		pageContext: {},
	};
}
