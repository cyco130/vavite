import { describe, test, expect, beforeAll, afterAll } from "vitest";
import puppeteer from "puppeteer";
import path from "node:path";
import fs from "node:fs";
import { spawn, ChildProcess } from "node:child_process";
import fetch from "node-fetch";
import { promisify } from "node:util";
import psTree from "ps-tree";
import { kill } from "node:process";

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

	let cp: ChildProcess | undefined;

	beforeAll(async () => {
		const command =
			env === "development"
				? "pnpm exec vite serve --strictPort --port 3000 --logLevel silent"
				: "pnpm run build && pnpm start";

		cp = spawn(command, {
			shell: true,
			stdio: "inherit",
			cwd: dir,
		});

		// Wait until server is ready
		await new Promise<void>((resolve, reject) => {
			cp!.on("error", reject);

			cp!.on("exit", (code) => {
				if (code !== 0) {
					cp = undefined;
					reject(new Error(`Process exited with code ${code}`));
				}
			});

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

	afterAll(async () => {
		if (!cp || cp.exitCode || !cp.pid) {
			return;
		}

		const tree = await promisify(psTree)(cp.pid);
		const pids = [cp.pid, ...tree.map((p) => +p.PID)];

		for (const pid of pids) {
			kill(+pid, "SIGINT");
		}

		await new Promise((resolve) => {
			cp!.on("exit", resolve);
		});
	});

	test("renders home page", async () => {
		const text = await fetch(TEST_HOST).then((r) => r.text());
		if (!text.includes("Hello")) console.log(text);
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
});

afterAll(async () => {
	await browser.close();
});
