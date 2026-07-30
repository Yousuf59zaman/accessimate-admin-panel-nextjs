import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Account, AccountType } from '@prisma/client';
import { compare } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-request';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto, type: AccountType) {
    const account = await this.prisma.account.findFirst({
      where: {
        type,
        isActive: true,
        OR: [{ loginId: dto.login_id }, { email: dto.login_id }],
      },
    });

    if (!account || !(await compare(dto.password, account.passwordHash))) {
      throw new UnauthorizedException('The login ID or password is incorrect.');
    }

    return this.sessionResponse(account);
  }

  async demoLogin(type: AccountType) {
    const account = await this.prisma.account.findFirst({
      where: { type, isDemo: true, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!account) {
      throw new ServiceUnavailableException(
        'Reviewer access is not seeded yet. Run the database seed first.',
      );
    }
    return this.sessionResponse(account);
  }

  async currentUser(user: AuthenticatedUser, expectedType: AccountType) {
    if (user.type !== expectedType) {
      throw new UnauthorizedException('This session cannot access the requested panel.');
    }

    const account = await this.prisma.account.findUnique({
      where: { id: user.id },
    });
    if (!account?.isActive) {
      throw new UnauthorizedException('This account is no longer active.');
    }

    return { status: true, data: this.accountDto(account) };
  }

  logout() {
    return { status: true, message: 'Signed out successfully.' };
  }

  ssoUnavailable() {
    throw new ServiceUnavailableException(
      'Social sign-in is disabled in this portfolio deployment because provider verification credentials are not configured.',
    );
  }

  private async sessionResponse(account: Account) {
    const token = await this.jwtService.signAsync({
      sub: account.id,
      loginId: account.loginId,
      type: account.type,
      isDemo: account.isDemo,
      roles: account.roles,
      permissions: account.permissions,
    });

    return {
      status: true,
      message: account.isDemo
        ? 'Reviewer session started.'
        : 'Signed in successfully.',
      data: { token, user: this.accountDto(account) },
    };
  }

  private accountDto(account: Account) {
    const profile =
      account.profile && typeof account.profile === 'object' && !Array.isArray(account.profile)
        ? account.profile
        : {};
    return {
      id: account.id,
      name: `${account.firstName} ${account.lastName}`.trim(),
      email: account.email,
      login_id: account.loginId,
      mobile: account.mobile,
      ccode: account.countryCode,
      photo: account.photoUrl,
      user_info: {
        first_name: account.firstName,
        middle_name:
          typeof profile.middleName === 'string' ? profile.middleName : '',
        last_name: account.lastName,
      },
      user_account_detail: { api_key: account.apiKey },
      roles: account.roles,
      permissions: account.permissions,
      is_demo: account.isDemo,
      profile: account.profile,
    };
  }
}
