import { createSSRApp, h } from "vue";
import App from "./App.vue";

async function render() {
	// Tiny, crappy router
	const importer = {
		"/": () => import("./pages/Home.vue"),
		"/foo": () => import("./pages/Foo.vue"),
		"/bar": () => import("./pages/Bar.vue"),
	}[window.location.pathname];

	if (!importer) {
		throw new Error(`No page found for ${window.location.pathname}`);
	}

	const Page = (await importer()).default;

	const app = createSSRApp({
		render() {
			return h(
				App,
				{},
				{
					default() {
						return h(Page, {});
					},
				},
			);
		},
	});

	app.mount("#root");
}

render();
