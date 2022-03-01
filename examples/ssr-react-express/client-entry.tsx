import { hydrate } from "react-dom";
import { App } from "./App";

async function render() {
	// Tiny, crappy router
	const importer = {
		"/": () => import("./pages/Home"),
		"/foo": () => import("./pages/Foo"),
		"/bar": () => import("./pages/Bar"),
	}[window.location.pathname];

	if (!importer) {
		throw new Error(`No page found for ${window.location.pathname}`);
	}

	const Page = (await importer()).default;

	const root = document.getElementById("root");
	hydrate(
		<App>
			<Page />
		</App>,
		root,
	);
}

render();
