import { test, expect } from "vitest";
import { execFileSync } from "node:child_process";
import path from "node:path";

const cwd = path.resolve(import.meta.dirname, "../examples/simple-standalone");

for (const input of [
	"/src/entry.server.ts",
	["/src/entry.server.ts"],
	{ "entry.server": "/src/entry.server.ts" },
]) {
	test(`normalizes build input ${JSON.stringify(input)} without losing the warning context`, () => {
		const output = execFileSync(
			process.execPath,
			[
				"--input-type=module",
				"-e",
				`
import { resolveConfig, version } from "vite";
import { vavite } from "vavite";
const optionsKey = version.startsWith("7.") ? "rollupOptions" : "rolldownOptions";
const config = await resolveConfig({
  configFile: false,
  logLevel: "silent",
  environments: { ssr: { build: { [optionsKey]: { input: ${JSON.stringify(input)} } } } },
  plugins: [vavite()],
}, "build");
console.log(JSON.stringify(config.environments.ssr.build[optionsKey].input));
`,
			],
			{ cwd, encoding: "utf8", timeout: 10_000 },
		);
		const inputs = Object.values(JSON.parse(output) as Record<string, string>);
		expect(inputs).toContain("/src/entry.server.ts");
		expect(inputs).toContain("/src/entry.server");
	});
}
