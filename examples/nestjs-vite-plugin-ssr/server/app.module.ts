
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { VpsModule } from './vps.module';

@Module({
  controllers: [AppController],
  imports: [VpsModule.forRoot()],
  providers: [],
})
export class AppModule { }
