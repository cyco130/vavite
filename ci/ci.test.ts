import { describe, test, expect, beforeAll, afterAll } from "vitest";
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { spawn, ChildProcess } from "child_process";
import fetch from "node-fetch";
// @ts-expect-error: No typings for this module
import kill from "kill-port";

const TEST_HOST = "http://localhost:3000";

const browser = await puppeteer.launch({
	// headless: false,
	defaultViewport: { width: 1200, height: 800 },
});

const pages = await browser.pages();
const page = pages[0];

const cases = [
	{
		framework: "simple-standalone",
		env: "development",
		file: "handler.ts",
	},
	{ framework: "simple-standalone", env: "production", file: "handler.ts" },

	{ framework: "express", env: "development", file: "routes/home.ts" },
	{ framework: "express", env: "production", file: "routes/home.ts" },

	{ framework: "fastify", env: "development", file: "routes/home.ts" },
	{ framework: "fastify", env: "production", file: "routes/home.ts" },

	{ framework: "koa", env: "development", file: "routes/home.ts" },
	{ framework: "koa", env: "production", file: "routes/home.ts" },

	{ framework: "hapi", env: "development", file: "routes/home.ts" },
	{ framework: "hapi", env: "production", file: "routes/home.ts" },

	{
		framework: "ssr-react-express",
		env: "development",
		file: "pages/Home.tsx",
	},
	{
		framework: "ssr-react-express",
		env: "production",
		file: "pages/Home.tsx",
	},

	{
		framework: "ssr-vue-express",
		env: "development",
		file: "pages/Home.vue",
	},
	{
		framework: "ssr-vue-express",
		env: "production",
		file: "pages/Home.vue",
	},

	{
		framework: "vite-plugin-ssr",
		env: "development",
		file: "pages/index/index.page.tsx",
	},
	{
		framework: "vite-plugin-ssr",
		env: "production",
		file: "pages/index/index.page.tsx",
	},
] as const;

describe.each(cases)("$framework - $env", ({ framework, env, file }) => {
	const ssr = framework.includes("ssr");
	const dir = path.resolve(__dirname, "..", "examples", framework);

	let cp: ChildProcess;

	beforeAll(async () => {
		await kill(3000, "tcp").catch(() => {
			// Do nothing
		});

		const command =
			env === "development"
				? "pnpm exec vite serve --strictPort --port 3000"
				: "pnpm run build && pnpm start";

		cp = spawn(command, {
			shell: true,
			stdio: "inherit",
			cwd: dir,
		});

		// Wait until server is ready
		await new Promise<void>((resolve, reject) => {
			cp.on("error", reject);

			const interval = setInterval(() => {
				fetch(TEST_HOST)
					.then(async (r) => {
						if (r.status === 200) {
							clearInterval(interval);
							resolve();
						}
					})
					.catch(() => {
						// Ignore error
					});
			}, 250);
		});
	}, 60_000);

	test("renders home page", async () => {
		await page.goto(TEST_HOST + "/");
		await page.waitForFunction(() => document.body.innerText.includes("Hello"));
	});

	if (ssr) {
		test("renders interactive page", async () => {
			await page.goto(TEST_HOST + "/");
			// Reload to allow for deps optimizations
			await new Promise((resolve) => setTimeout(resolve, 1000));
			await page.goto(TEST_HOST + "/");
			const button = await page.waitForSelector("button");
			expect(button).toBeTruthy();
			await button!.click();
			await page.waitForFunction(() =>
				document.querySelector("button")!.innerText.includes("1"),
			);
		});
	}

	if (env === "development") {
		test("hot reloads page", async () => {
			await page.goto(TEST_HOST);

			const filePath = path.resolve(dir, file);
			const oldContent = await fs.promises.readFile(filePath, "utf8");
			const newContent = oldContent.replace("Hello from", "Hot reloadin'");

			await new Promise((resolve) => setTimeout(resolve, 500));
			await fs.promises.writeFile(filePath, newContent);
			await new Promise((resolve) => setTimeout(resolve, 500));

			if (!ssr) {
				await page.goto(TEST_HOST);
			}

			try {
				await page.waitForFunction(
					() => document.body.textContent?.includes("Hot reloadin'"),
					{ timeout: 60_000 },
				);
			} finally {
				await fs.promises.writeFile(filePath, oldContent);
			}
		}, 60_000);
	}

	afterAll(async () => {
		await kill(3000, "tcp").catch(() => {
			// Do nothing
		});
	});
});

afterAll(async () => {
	await browser.close();
});
