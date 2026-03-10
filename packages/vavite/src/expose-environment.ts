import type { Plugin } from "vite";

export function exposeEnvironment(): Plugin {
	let command: "serve" | "build";

	return {
		name: "vavite:expose-environment",

		config(_config, env) {
			command = env.command;
		},

		configEnvironment(name, config) {
			config.define ??= {};
			config.define["import.meta.env.COMMAND"] = JSON.stringify(command);
			config.define["import.meta.env.ENVIRONMENT"] = JSON.stringify(name);
		},
	} satisfies Plugin;
}
