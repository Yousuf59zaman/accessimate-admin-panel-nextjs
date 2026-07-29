import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccountType } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-request';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SsoLoginDto } from './dto/sso-login.dto';

@ApiTags('Authentication')
@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @Post('admin/login')
  loginAdmin(@Body() dto: LoginDto) {
    return this.auth.login(dto, AccountType.ADMIN);
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('admin/demo-login')
  demoAdmin() {
    return this.auth.demoLogin(AccountType.ADMIN);
  }

  @ApiBearerAuth()
  @Post('admin/user')
  adminUser(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.currentUser(user, AccountType.ADMIN);
  }

  @ApiBearerAuth()
  @Post('admin/logout')
  adminLogout() {
    return this.auth.logout();
  }

  @Public()
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @Post('customer/login')
  loginCitizen(@Body() dto: LoginDto) {
    return this.auth.login(dto, AccountType.CITIZEN);
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('customer/demo-login')
  demoCitizen() {
    return this.auth.demoLogin(AccountType.CITIZEN);
  }

  @Public()
  @Post('customer/sso-login')
  ssoCitizen(@Body() dto: SsoLoginDto) {
    void dto;
    return this.auth.ssoUnavailable();
  }

  @ApiBearerAuth()
  @Post('customer/user')
  citizenUser(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.currentUser(user, AccountType.CITIZEN);
  }

  @ApiBearerAuth()
  @Post('customer/logout')
  citizenLogout() {
    return this.auth.logout();
  }
}
