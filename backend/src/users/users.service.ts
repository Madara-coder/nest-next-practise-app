import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { EntityManager, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto.js';
import { User } from './entities/user.entity.js';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findAll(tenantId: string): Promise<User[]> {
    return this.usersRepository.find({
      where: { tenantId },
      order: { createdAt: 'ASC' },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: { tenant: true },
    });
  }

  /** Includes the password hash, which is excluded from normal queries. */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .getOne();
  }

  async create(
    tenantId: string,
    dto: CreateUserDto,
    manager: EntityManager = this.usersRepository.manager,
  ): Promise<User> {
    const email = dto.email.toLowerCase();
    const exists = await manager.existsBy(User, { email });
    if (exists) {
      throw new ConflictException('A user with this email already exists');
    }

    const user = manager.create(User, {
      tenantId,
      email,
      fullName: dto.fullName,
      role: dto.role,
      passwordHash: await hash(dto.password, BCRYPT_ROUNDS),
    });
    const saved = await manager.save(user);
    const { passwordHash: _passwordHash, ...rest } = saved;
    return rest as User;
  }
}
