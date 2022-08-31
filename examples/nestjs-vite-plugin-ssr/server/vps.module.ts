import { DynamicModule, Inject, Module, OnModuleInit } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import type { NextFunction, Request, Response } from "express";
import path, { join } from "path";
import { fileURLToPath } from "url";
import { renderPage } from "vite-plugin-ssr";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OPTIONS = Symbol.for("vite-plugin-ssr.options");
import { ServeStaticModule } from "@nestjs/serve-static";

interface ViteSsrOptions {
	root?: string;
}

@Module({})
export class VpsModule implements OnModuleInit {
	constructor(
		private readonly httpAdapterHost: HttpAdapterHost,
		@Inject(OPTIONS)
		private readonly viteSsrOptions: ViteSsrOptions,
	) {}

	static forRoot(options?: ViteSsrOptions): DynamicModule {
		options ??= {
			root: join(__dirname, "..", "client"),
		};
		const imports: DynamicModule[] = [];
		if (import.meta.env.PROD) {
			imports.push(
				ServeStaticModule.forRoot({
					rootPath: options.root,
					serveRoot: "/",
				}),
			);
		}
		return {
			module: VpsModule,
			imports,
			providers: [{ provide: OPTIONS, useValue: options }],
		};
	}

	async onModuleInit() {
		if (!this.httpAdapterHost) {
			throw new Error(
				"httpAdapterHost is undefined, no decorator metadata available",
			);
		}
		const httpAdapter = this.httpAdapterHost.httpAdapter;
		if (!httpAdapter) {
			return;
		}
		const app = httpAdapter.getInstance();

		app.get("*", async (req: Request, res: Response, _next: NextFunction) => {
			const urlOriginal = req.originalUrl;
			const pageContextInit = {
				urlOriginal,
				req,
				res,
			};
			const pageContext = await renderPage(pageContextInit);
			const { httpResponse } = pageContext;
			if (!httpResponse) return;
			const { statusCode, contentType } = httpResponse;
			res.status(statusCode).type(contentType);
			httpResponse.pipe(res);
		});
	}
}
