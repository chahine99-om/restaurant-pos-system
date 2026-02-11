import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { RoleName } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const VERIFICATION_EXPIRY_HOURS = 24;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');
    const cashierRole = await this.prisma.role.findUnique({ where: { name: RoleName.CASHIER } });
    if (!cashierRole) throw new BadRequestException('System configuration error');
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName: dto.fullName.trim(),
        roleId: cashierRole.id,
        verificationToken: token,
        verificationTokenExpiresAt: expiresAt,
      },
    });
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const verificationLink = `${frontendUrl}/verify-email?token=${token}`;
    const { sent, link } = await this.mailService.sendVerificationEmail(email, verificationLink);
    return {
      message: 'Account created. Please verify your email.',
      email,
      ...(link && { verificationLink: link }),
      emailSent: sent,
    };
  }

  async verifyEmail(token: string) {
    if (!token?.trim()) throw new BadRequestException('Token is required');
    const user = await this.prisma.user.findFirst({
      where: { verificationToken: token.trim() },
      include: { role: true },
    });
    if (!user) throw new UnauthorizedException('Invalid or expired verification link');
    if (user.verificationTokenExpiresAt && user.verificationTokenExpiresAt < new Date()) {
      throw new UnauthorizedException('Verification link has expired');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        verificationToken: null,
        verificationTokenExpiresAt: null,
      },
    });
    return { message: 'Email verified. You can now log in.', email: user.email };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
      include: { role: true },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException('Please verify your email before logging in.');
    }
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { sub: user.id, email: user.email, role: user.role.name };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role.name,
      },
    };
  }
}
