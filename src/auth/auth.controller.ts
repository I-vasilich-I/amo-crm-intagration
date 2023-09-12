import { Controller, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';

type AuthQuery = {
  code: string;
  referer: string;
  platform: string;
  client_id: string;
  from_widget: string;
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('code')
  async getCode(@Query() { code }: AuthQuery) {
    // will store code in memory
    this.authService.setCode(code);

    // since code will expire in 20 min, makes sense to get&set Tokens right away;
    await this.authService.setTokens();
  }
}
