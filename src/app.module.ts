import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GithubModule } from './github/github.module';
import { CacheModule, CacheInterceptor } from '@nestjs/cache-manager';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';


@Module({
  imports: [
    CacheModule.register({ 
      ttl: 3600, // Time to live in seconds (1 hour)
      max: 1000,  // Max number of items in the cache (optional)
      isGlobal: true, // Make CacheModule available everywhere
    }),
    GithubModule,
    AuthModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
