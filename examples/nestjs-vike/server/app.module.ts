import { Module } from "@nestjs/common";
import { VpsModule } from "./vps.module";

@Module({
	imports: [VpsModule.forRoot()],
	providers: [],
})
export class AppModule {}
