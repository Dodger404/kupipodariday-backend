import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wish } from './entities/wish.entity';
import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class WishesService {
  constructor(
    @InjectRepository(Wish)
    private readonly wishRepo: Repository<Wish>,
  ) {}

  create(dto: CreateWishDto, owner: User) {
    const wish = this.wishRepo.create({ ...dto, owner });
    return this.wishRepo.save(wish);
  }

  findAll() {
    return this.wishRepo.find({ relations: ['owner'] });
  }

  findOne(id: number) {
    return this.wishRepo.findOne({
      where: { id },
      relations: ['owner', 'offers'],
    });
  }

  async findLast(): Promise<Wish[]> {
    return this.wishRepo.find({
      order: { createdAt: 'DESC' },
      take: 40,
      relations: ['owner'],
    });
  }

  async findTop(): Promise<Wish[]> {
    return this.wishRepo.find({
      order: { copied: 'DESC' },
      take: 20,
      relations: ['owner'],
    });
  }

  async copyWish(id: number, user: User) {
    const wish = await this.wishRepo.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!wish) throw new NotFoundException('Подарок не найден');
    if (wish.owner.id === user.id) throw new ForbiddenException('Нельзя копировать свой подарок');

    wish.copied += 1;
    await this.wishRepo.save(wish);

    const newWish = this.wishRepo.create({
      name: wish.name,
      link: wish.link,
      image: wish.image,
      price: wish.price,
      description: wish.description,
      owner: user,
      raised: 0,
      copied: 0,
    });

    return this.wishRepo.save(newWish);
  }

  async update(id: number, dto: UpdateWishDto, user: User) {
    const wish = await this.wishRepo.findOne({
      where: { id },
      relations: ['owner', 'offers'],
    });
    if (!wish) throw new NotFoundException('Подарок не найден');
    if (wish.owner.id !== user.id)
      throw new ForbiddenException('Нельзя редактировать чужой подарок');
    if (wish.offers?.length)
      throw new ForbiddenException(
        'Нельзя редактировать подарок, на который уже скинулись',
      );

    Object.assign(wish, dto);
    return this.wishRepo.save(wish);
  }

  async remove(id: number, user: User) {
    const wish = await this.wishRepo.findOne({
      where: { id },
      relations: ['owner', 'offers'],
    });
    if (!wish) throw new NotFoundException('Подарок не найден');
    if (wish.owner.id !== user.id)
      throw new ForbiddenException('Нельзя удалить чужой подарок');

    return this.wishRepo.delete(id);
  }
}
