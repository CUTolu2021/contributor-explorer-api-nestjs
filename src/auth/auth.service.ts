import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService) {}

  async placeholderLogin() {
    // This payload contains data we want to embed in the token
    const payload = { 
      username: 'tempUser', 
      userId: 1, 
    };

    return {
      // Create and sign the token
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  
}
