import { IsBoolean, IsNumber, IsPositive } from 'class-validator';

export class CreateOfferDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsBoolean()
  hidden: boolean;
}
