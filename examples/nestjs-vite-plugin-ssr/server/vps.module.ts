import { DynamicModule, Inject, Module, OnModuleInit } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import express, { NextFunction, Request, Response } from "express";
import path, { join } from "path";
import { fileURLToPath } from "url";
import { renderPage } from "vite-plugin-ssr";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OPTIONS = Symbol.for("vite-plugin-ssr.options");

interface ViteSsrOptions {
    root?: string;
}

@Module({})
export class VpsModule implements OnModuleInit {
    constructor(
        private readonly httpAdapterHost: HttpAdapterHost,
        @Inject(OPTIONS)
        private readonly viteSsrOptions: ViteSsrOptions
    ) { }

    static forRoot(options?: ViteSsrOptions): DynamicModule {
        options ??= {
            root: join(__dirname, "..", "client"),
        };
        return {
            module: VpsModule,
            providers: [{ provide: OPTIONS, useValue: options }],
        };
    }

    async onModuleInit() {
        if (!this.httpAdapterHost) {
            throw new Error("httpAdapterHost is undefined, no decorator metadata available");
        }
        const httpAdapter = this.httpAdapterHost.httpAdapter;
        if (!httpAdapter) {
            return;
        }
        const app = httpAdapter.getInstance();

        if (import.meta.env.PROD) {
            app.use(express.static(this.viteSsrOptions.root!));
        }

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
