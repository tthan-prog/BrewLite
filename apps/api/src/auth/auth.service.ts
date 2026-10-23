import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import type { JwtPayload } from './auth.types.js';
import type { LoginDto, RegisterDto } from './dto.js';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email đã được đăng ký');
    }

    const password = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    try {
      // Đăng ký công khai luôn tạo CUSTOMER; STAFF chỉ tạo qua seed/quản trị.
      const user = await this.prisma.user.create({
        data: {
          email,
          password,
          name: dto.name?.trim() || null,
          role: 'CUSTOMER',
        },
      });
      return this.issueToken(user);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email đã được đăng ký');
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Cùng một thông báo cho "không có email" và "sai mật khẩu".
    const ok = user ? await bcrypt.compare(dto.password, user.password) : false;
    if (!user || !ok) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    return this.issueToken(user);
  }

  private async issueToken(user: {
    id: number;
    email: string;
    name: string | null;
    role: string;
  }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as JwtPayload['role'],
    };
    return {
      accessToken: await this.jwt.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
