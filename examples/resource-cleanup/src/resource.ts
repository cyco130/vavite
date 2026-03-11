export interface ResourceConfig {
	foo: string;
	bar: number;
}

export class Resource {
	#message: string | null = null;

	constructor(config: ResourceConfig) {
		this.#message = `foo: ${config.foo}, bar: ${config.bar}`;
		console.log("Resource created with config:", config);
	}

	get message() {
		if (this.#message === null) {
			throw new Error("Resource has been cleaned up");
		}

		return this.#message;
	}

	cleanup() {
		console.log("Cleaning up resource with message:", this.message);
		this.#message = null;
	}
}
