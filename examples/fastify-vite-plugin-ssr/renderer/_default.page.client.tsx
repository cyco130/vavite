import React from "react";
import { PageWrapper } from "./PageWrapper";
import type { PageContext } from "./types";
import { PageContextBuiltInClientWithClientRouting } from "vite-plugin-ssr/types";
import { hydrateRoot } from "react-dom/client";

export async function render(
	pageContext: PageContextBuiltInClientWithClientRouting & PageContext,
) {
	const { Page, pageProps } = pageContext;
	hydrateRoot(
		document.getElementById("page-view")!,
		<PageWrapper pageContext={pageContext}>
			<Page {...pageProps} />
		</PageWrapper>,
	);
}
