import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Organic Basmati Rice 25kg' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'RICE-BAS-25' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  sku: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: 350000, description: 'Price in paisa (1/100 NPR)' })
  @IsInt()
  @Min(0)
  priceCents: number;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(0)
  stock: number;
}
