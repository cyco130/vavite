import type { AssertionError } from "assert";
import { compare } from "uvu/diff";

const tests: [string, Function][] = [];

export function test(description: string, func: Function) {
	tests.push([description, func]);
}

(globalThis as any).$vavite$run = async function run() {
	const results: [string, string?][] = [];

	for (const [desc, test] of tests) {
		try {
			await test();
		} catch (error: any) {
			results.push([desc, format(error)]);
			continue;
		}

		results.push([desc]);
	}

	tests.length = 0;

	return results;
};

function format(error: any) {
	if (error instanceof Error) {
		if (isAssertionError(error)) {
			return error.message + "\n" + compare(error.actual, error.expected);
		}

		return error.stack;
	}

	return String(error);
}

function isAssertionError(error: Error): error is AssertionError {
	return error.name === "AssertionError";
}
