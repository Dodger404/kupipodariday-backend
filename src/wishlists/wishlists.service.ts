import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Wishlist } from './entities/wishlist.entity';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { User } from 'src/users/entities/user.entity';
import { Wish } from 'src/wishes/entities/wish.entity';

@Injectable()
export class WishlistsService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepo: Repository<Wishlist>,
    @InjectRepository(Wish)
    private readonly wishRepo: Repository<Wish>,
  ) {}

  async create(dto: CreateWishlistDto, owner: User) {
    const wishes = await this.wishRepo.findBy({ id: In(dto.itemsId) });
    const wishlist = this.wishlistRepo.create({
      ...dto,
      items: wishes,
      owner,
    });
    return this.wishlistRepo.save(wishlist);
  }

  findAll() {
    return this.wishlistRepo.find({ relations: ['owner', 'items'] });
  }

  findOne(id: number) {
    return this.wishlistRepo.findOne({
      where: { id },
      relations: ['owner', 'items'],
    });
  }

  async update(id: number, dto: UpdateWishlistDto, user: User) {
    const wishlist = await this.wishlistRepo.findOne({
      where: { id },
      relations: ['owner', 'items'],
    });

    if (!wishlist) throw new NotFoundException('Подборка не найдена');
    if (wishlist.owner.id !== user.id)
      throw new ForbiddenException('Нельзя редактировать чужую подборку');

    if (dto.itemsId) {
      const wishes = await this.wishRepo.findBy({ id: In(dto.itemsId) });
      wishlist.items = wishes;
    }

    Object.assign(wishlist, dto);
    return this.wishlistRepo.save(wishlist);
  }

  async remove(id: number, user: User) {
    const wishlist = await this.wishlistRepo.findOne({
      where: { id },
      relations: ['owner'],
    });
    if (!wishlist) throw new NotFoundException('Подборка не найдена');
    if (wishlist.owner.id !== user.id)
      throw new ForbiddenException('Нельзя удалить чужую подборку');

    return this.wishlistRepo.delete(id);
  }
}
