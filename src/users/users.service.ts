import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(userData: Partial<User>) {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async findByUsername(username: string) {
    const user = await this.usersRepository.findOne({
      where: { username },
      relations: ['wishes'],
    });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
  }

  async updateUser(id: number, dto: UpdateUserDto) {
    await this.usersRepository.update(id, dto);
    return this.findById(id);
  }

  async findById(id: number) {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['wishes'],
    });
  }

  async findMany(query: string) {
    return this.usersRepository.find({
      where: [
        { username: ILike(`%${query}%`) },
        { email: ILike(`%${query}%`) },
      ],
    });
  }
}
