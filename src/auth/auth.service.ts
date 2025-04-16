import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { SignUpDto } from './dto/signup.dto';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { excludePassword } from '../utils/exclude-password';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signup(signUpDto: SignUpDto) {
    const hashedPassword = await bcrypt.hash(signUpDto.password, 10);
    const userData = { ...signUpDto, password: hashedPassword };
    const createdUser = await this.usersService.create(userData);

    // ⚠️ createdUser уже безопасен, не надо повторно очищать
    return createdUser;
  }

  async validateUser(username: string, password: string) {
    const user = await this.usersService.findByUsernameWithPassword(username);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    return excludePassword(user);
  }

  async login(user: User) {
    const payload = { sub: user.id, username: user.username };
    return {
      access_token: this.jwtService.sign(payload),
      user: excludePassword(user),
    };
  }
}