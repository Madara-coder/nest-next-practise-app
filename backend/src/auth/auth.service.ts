import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { DataSource } from 'typeorm';
import { Role } from '../common/enums/role.enum.js';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface.js';
import { Tenant } from '../tenants/entities/tenant.entity.js';
import { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  /** Creates a new tenant (company) together with its first admin user. */
  async register(dto: RegisterDto): Promise<string> {
    const user = await this.dataSource.transaction(async (manager) => {
      const tenant = await manager.save(
        manager.create(Tenant, {
          name: dto.companyName,
          slug: this.slugify(dto.companyName),
        }),
      );
      return this.usersService.create(
        tenant.id,
        {
          email: dto.email,
          fullName: dto.fullName,
          password: dto.password,
          role: Role.Admin,
        },
        manager,
      );
    });
    return this.signToken(user);
  }

  async login(dto: LoginDto): Promise<string> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    // Same error for unknown email and wrong password to avoid user enumeration.
    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.signToken(user);
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  private signToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.signAsync(payload);
  }

  private slugify(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return `${base}-${randomBytes(3).toString('hex')}`;
  }
}
