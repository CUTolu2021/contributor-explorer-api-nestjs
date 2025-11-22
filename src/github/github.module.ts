import { Module } from '@nestjs/common';
import { GithubService } from './github.service';
import { HttpModule } from '@nestjs/axios';
import { GithubController } from './github.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  providers: [GithubService],
  imports: [
    CacheModule.register(), // Import CacheModule to make CACHE_MANAGER available
    ConfigModule.forRoot(), // This loads the .env file and makes variables available
    // Use an async factory to ensure ConfigService is available
    HttpModule.registerAsync({
      imports: [ConfigModule], // Make sure ConfigModule is imported
      useFactory: async (configService: ConfigService) => ({
        timeout: 60000,
        headers: {
          Authorization: `token ${configService.get<string>('GITHUB_PAT')}`,
        },
      }),
      inject: [ConfigService], // Inject ConfigService into the factory
    }),
  ],
  exports: [GithubService],
  controllers: [GithubController],
})
export class GithubModule {}
