import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RoleName } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (existing) throw new ConflictException('Email already registered');
    const role = await this.prisma.role.findUnique({ where: { name: dto.role } });
    if (!role) throw new NotFoundException('Role not found');
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        password: hashed,
        fullName: dto.fullName.trim(),
        roleId: role.id,
      },
      include: { role: true },
    });
    return this.sanitize(user);
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    });
    return users.map((u) => this.sanitize(u));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitize(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = {};
    if (dto.email != null) data.email = dto.email.toLowerCase().trim();
    if (dto.fullName != null) data.fullName = dto.fullName.trim();
    if (dto.isActive != null) data.isActive = dto.isActive;
    if (dto.password != null) data.password = await bcrypt.hash(dto.password, 10);
    if (dto.role != null) {
      const role = await this.prisma.role.findUnique({ where: { name: dto.role } });
      if (!role) throw new NotFoundException('Role not found');
      data.roleId = role.id;
    }
    const user = await this.prisma.user.update({
      where: { id },
      data,
      include: { role: true },
    });
    return this.sanitize(user);
  }

  private sanitize(user: { id: string; email: string; fullName: string; isActive: boolean; role: { name: RoleName } }) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isActive: user.isActive,
      role: user.role.name,
    };
  }
}
