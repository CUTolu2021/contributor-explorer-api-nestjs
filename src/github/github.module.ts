import { Module } from '@nestjs/common';
import { GithubService } from './github.service';
import { HttpModule } from '@nestjs/axios';
import { GithubController } from './github.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  providers: [GithubService],
  imports: [
    CacheModule.register(), 
    ConfigModule.forRoot(), 
    
    HttpModule.registerAsync({
      imports: [ConfigModule], 
      useFactory: async (configService: ConfigService) => ({
        timeout: 60000,
        headers: {
          Authorization: `token ${configService.get<string>('GITHUB_PAT')}`,
        },
      }),
      inject: [ConfigService], 
    }),
  ],
  exports: [GithubService],
  controllers: [GithubController],
})
export class GithubModule {}
