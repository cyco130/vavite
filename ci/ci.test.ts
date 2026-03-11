import { describe, test, expect, beforeAll, afterAll } from "vitest";
import puppeteer from "puppeteer";
import path from "node:path";
import fs from "node:fs";
import { spawn } from "node:child_process";
import { launchAndTest, LaunchAndTestCleanupFunction } from "kill-em-all";

const TEST_PORT = 3000;
const TEST_HOST = `http://localhost:${TEST_PORT}`;

const browser = await puppeteer.launch({
	headless: true,
	defaultViewport: { width: 1200, height: 800 },
});

const pages = await browser.pages();
const page = pages[0];

const baseCases: Array<{
	framework: string;
	file: string;
	packageManager?: "pnpm" | "bun";
}> = [
	{ framework: "simple-standalone", file: "src/entry.server.ts" },
	{ framework: "express", file: "src/routes/home.ts" },
	{ framework: "express-server", file: "src/routes/home.ts" },
	{ framework: "fastify", file: "src/routes/home.ts" },
	{ framework: "koa", file: "src/routes/home.ts" },
	{ framework: "hapi", file: "src/routes/home.ts" },
	{ framework: "ssr-react-express", file: "src/pages/Home.tsx" },
	{ framework: "nestjs", file: "src/app.controller.ts" },
	{
		framework: "bun-server",
		file: "src/routes/home.ts",
		packageManager: "bun",
	},
];

const cases: Array<{
	framework: string;
	file: string;
	env: "production" | "development";
	packageManager?: "pnpm" | "bun";
}> = [
	// ...baseCases.map((x) => ({ ...x, env: "production" as const })),
	...baseCases.map((x) => ({ ...x, env: "development" as const })),
];

describe.each(cases)(
	"$framework - $env ",
	({ framework, env, file, packageManager = "pnpm" }) => {
		const ssr = framework.includes("ssr");
		const dir = path.resolve(__dirname, "..", "examples", framework);
		let kill: LaunchAndTestCleanupFunction;

		beforeAll(async () => {
			const runCommand =
				packageManager === "bun" ? "bun run --bun" : "pnpm run";
			const execCommand =
				packageManager === "bun" ? "bun x --bun" : "pnpm exec";

			let command =
				env === "production"
					? `${runCommand} build && ${runCommand} start`
					: `${execCommand} vite serve --strictPort --port ${TEST_PORT}`;

			console.log(command);
			const cp = spawn(command, {
				shell: true,
				stdio: "inherit",
				cwd: dir,
				// env: {
				// 	...process.env,
				// 	// PORT: env === "production" ? String(TEST_PORT) : "4000",
				// },
			});

			kill = await launchAndTest(cp, TEST_HOST);
		}, 20_000);

		afterAll(async () => {
			await kill?.();
		});

		test("renders home page", async () => {
			const text = await fetch(TEST_HOST).then((r) => r.text());
			expect(text).toContain("Hello");
		}, 10_000);

		if (ssr) {
			test("renders interactive page", async () => {
				await new Promise((resolve) => setTimeout(resolve, 1000));
				await page.goto(TEST_HOST + "/");
				await new Promise((resolve) => setTimeout(resolve, 1000));

				await page.waitForFunction(
					() => {
						const button = document.querySelector("button")!;
						button.click();
						return button.innerText.includes("1");
					},
					{ timeout: 10_000 },
				);
			}, 15_000);
		}

		if (env !== "production") {
			test("hot reloads page", async () => {
				await page.goto(TEST_HOST);

				const filePath = path.resolve(dir, file);
				const oldContent = await fs.promises.readFile(filePath, "utf8");
				const newContent = oldContent.replace("Hello from", "Hot reloadin'");

				await new Promise((resolve) => setTimeout(resolve, 1000));
				await fs.promises.writeFile(filePath, newContent);
				await new Promise((resolve) => setTimeout(resolve, 3000));

				try {
					if (!ssr) {
						await page.goto(TEST_HOST);
					}

					await page.waitForFunction(
						() => document.body.textContent?.includes("Hot reloadin'"),
						{ timeout: 20_000 },
					);
				} finally {
					await fs.promises.writeFile(filePath, oldContent);
				}
			}, 20_000);
		}
	},
);

afterAll(async () => {
	await browser.close();
});
