import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer } from './entities/offer.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { User } from 'src/users/entities/user.entity';
import { Wish } from 'src/wishes/entities/wish.entity';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,
    @InjectRepository(Wish)
    private readonly wishRepo: Repository<Wish>,
  ) {}

  async create(dto: CreateOfferDto, user: User) {
    const wish = await this.wishRepo.findOne({
      where: { id: dto.itemId },
      relations: ['owner', 'offers'],
    });

    if (!wish) {
      throw new NotFoundException('Подарок не найден');
    }

    if (!wish) throw new NotFoundException('Подарок не найден');
    if (wish.owner.id === user.id)
      throw new ForbiddenException('Нельзя скидываться на свой подарок');
    if (Number(wish.raised) + Number(dto.amount) > Number(wish.price)) {
      throw new BadRequestException('Нельзя превысить стоимость подарка');
    }

    wish.raised = Number(wish.raised) + Number(dto.amount);
    await this.wishRepo.save(wish);

    const offer = this.offerRepo.create({
      amount: dto.amount,
      hidden: dto.hidden,
      user,
      item: wish,
    });

    return this.offerRepo.save(offer);
  }

  findAll() {
    return this.offerRepo.find({ relations: ['user', 'item'] });
  }

  findOne(id: number) {
    return this.offerRepo.findOne({
      where: { id },
      relations: ['user', 'item'],
    });
  }
}
