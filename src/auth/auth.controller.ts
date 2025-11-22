import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('login') 
  @ApiOperation({ summary: 'Returns a placeholder JWT token.' })
  @ApiResponse({ status: 200, description: 'Placeholder JWT token.' })
  @ApiResponse({ status: 404, description: 'Placeholder JWT token.' })
  async login() {
    return this.authService.placeholderLogin();
  }
}
