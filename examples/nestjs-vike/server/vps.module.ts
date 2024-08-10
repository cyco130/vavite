import { DynamicModule, Inject, Module, OnModuleInit } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import type { NextFunction, Request, Response } from "express";
import { fileURLToPath } from "node:url";
import { renderPage } from "vike/server";
import { ServeStaticModule } from "@nestjs/serve-static";
import devServer from "vavite/http-dev-server";

const OPTIONS = Symbol.for("vike.options");

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
			root: fileURLToPath(new URL("../client", import.meta.url)),
		};

		const imports: DynamicModule[] = [];
		if (!devServer) {
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

		app.get("*", async (req: Request, res: Response, next: NextFunction) => {
			const urlOriginal = req.originalUrl;
			const pageContext = await renderPage({ urlOriginal });
			const { httpResponse } = pageContext;
			if (!httpResponse) {
				next();
				return;
			}
			const { body, statusCode, headers } = httpResponse;
			headers.forEach(([name, value]) => res.header(name, value));
			res.status(statusCode);
			res.send(body);
		});
	}
}
