import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService) {}

  async generateJwt(user: any): Promise<string> {
    const payload = { 
      username: user.username, 
      sub: user.githubId, 
    };
    return this.jwtService.signAsync(payload);
  }
  async placeholderLogin() {
    
    const payload = { 
      username: 'tempUser', 
      userId: 1, 
    };
//For people who want to test without going through GitHub OAuth (swagger, etc)
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async validatetoken(token: string): Promise<boolean> {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      return !!payload; 
    } catch (error) {
      return false; 
    }
  }

  
}
