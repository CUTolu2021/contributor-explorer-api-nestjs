import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('github')
  @UseGuards(AuthGuard('github')) 
  async githubLogin() {}

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthCallback(@Req() req, @Res() res: Response) {
    const user = req.user;

    const jwtToken = await this.authService.generateJwt(user);
    const frontendUrl = 'http://localhost:4200'; 
    return res.redirect(`${frontendUrl}/login?token=${jwtToken}`);
  }

  @Get('validate-token')
  @UseGuards(JwtAuthGuard) 
  async validateToken(@Req() req) {
    // If the request reaches here, the JWT guard has already validated the token
    const token = req.headers.authorization?.replace('Bearer ', '');
    const isValid = await this.authService.validatetoken(token);
    return { 
      valid: isValid,
      user: req.user,
      message: 'Token validation complete'
    };
  }

  @Get('login') 
  @ApiOperation({ summary: 'Returns a placeholder JWT token.' })
  @ApiResponse({ status: 200, description: 'Placeholder JWT token.' })
  @ApiResponse({ status: 404, description: 'Placeholder JWT token.' })
  async login() {
    return this.authService.placeholderLogin();
  }
}
