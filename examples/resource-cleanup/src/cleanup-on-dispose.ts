import { Resource } from "./resource";

const CONFIG = {
	foo: "resource1",
	bar: 1,
};

export const resource1 = new Resource(CONFIG);

if (import.meta.hot) {
	import.meta.hot.accept();

	import.meta.hot.dispose(() => {
		resource1.cleanup();
	});
}
