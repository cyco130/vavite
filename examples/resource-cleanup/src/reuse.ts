import { Resource } from "./resource";

const CONFIG = {
	foo: "resource2",
	bar: 2,
};

if (import.meta.hot && import.meta.hot.data.oldConfig) {
	function isSameConfig(oldConfig: typeof CONFIG) {
		return (
			oldConfig && oldConfig.foo === CONFIG.foo && oldConfig.bar === CONFIG.bar
		);
	}

	if (!isSameConfig(import.meta.hot.data.oldConfig)) {
		console.log(
			"Config changed, will clean up the resource and create a new one",
		);
		import.meta.hot.data.oldResource.cleanup();
		delete import.meta.hot.data.oldResource;
	} else {
		console.log("Config is the same, will reuse the same resource");
	}
}

export const resource2 =
	import.meta.hot?.data.oldResource ?? new Resource(CONFIG);

if (import.meta.hot) {
	import.meta.hot.accept();

	import.meta.hot.dispose(() => {
		import.meta.hot!.data.oldConfig = CONFIG;
		import.meta.hot!.data.oldResource = resource2;
	});
}
