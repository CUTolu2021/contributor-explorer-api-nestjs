import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GithubProfile } from 'src/interfaces/githubprofile.interface';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private configService: ConfigService) {
    
    
    const clientID = configService.get('GITHUB_CLIENT_ID');
    const clientSecret = configService.get('GITHUB_CLIENT_SECRET');
    const callbackURL = configService.get('GITHUB_CALLBACK_URL');
    
    
    if (!clientID || !clientSecret || !callbackURL) {
      throw new InternalServerErrorException(
        'Missing required GitHub environment variables (ID, Secret, or Callback URL).'
      );
    }
    
    
    super({
      clientID: clientID!,      
      clientSecret: clientSecret!,
      callbackURL: callbackURL!,  
      scope: ['read:user', 'user:email'], 
    });
  }

  
  async validate(accessToken: string, refreshToken: string, profile: GithubProfile, done: Function): Promise<any> {
    const user = {
      githubId: profile.githubId,
      username: profile.username,
      displayName: profile.displayName,
    };
    done(null, user);
  }
}