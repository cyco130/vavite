import ReactDOMServer from "react-dom/server";
import { PageWrapper } from "./PageWrapper";
import { escapeInject, dangerouslySkipEscape } from "vike/server";
import logoUrl from "./logo.svg";
import type { PageContext } from "./types";

export { render };

// See https://vite-plugin-ssr.com/data-fetching
export const passToClient = ["pageProps", "urlPathname"];

async function render(pageContext: PageContext) {
	const { Page, pageProps } = pageContext;
	const pageHtml = ReactDOMServer.renderToString(
		<PageWrapper pageContext={pageContext}>
			<Page {...pageProps} />
		</PageWrapper>,
	);

	// See https://vite-plugin-ssr.com/html-head
	const { documentProps } = pageContext;
	const title = (documentProps && documentProps.title) || "Vite SSR app";
	const desc =
		(documentProps && documentProps.description) ||
		"App using Vite + vite-plugin-ssr";

	const documentHtml = escapeInject`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <link rel="icon" href="${logoUrl}" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="${desc}" />
        <title>${title}</title>
      </head>
      <body>
        <div id="page-view">${dangerouslySkipEscape(pageHtml)}</div>
      </body>
    </html>`;

	return {
		documentHtml,
		pageContext: {
			// We can add some `pageContext` here, which is useful if we want to do page redirection https://vite-plugin-ssr.com/page-redirection
		},
	};
}
