import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, QueryFailedError, Repository } from 'typeorm';
import { Paginated } from '../common/dto/pagination-query.dto.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { ListProductsQueryDto } from './dto/list-products-query.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { Product } from './entities/product.entity.js';

const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async findAll(
    tenantId: string,
    { page, limit, search }: ListProductsQueryDto,
  ): Promise<Paginated<Product>> {
    const where = search
      ? [
          { tenantId, name: ILike(`%${search}%`) },
          { tenantId, sku: ILike(`%${search}%`) },
        ]
      : { tenantId };

    const [data, total] = await this.productsRepository.findAndCount({
      where,
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { page, limit, total } };
  }

  async findOne(tenantId: string, id: string): Promise<Product> {
    const product = await this.productsRepository.findOneBy({ id, tenantId });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async create(tenantId: string, dto: CreateProductDto): Promise<Product> {
    const product = this.productsRepository.create({ ...dto, tenantId });
    return this.saveOrConflict(product);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(tenantId, id);
    return this.saveOrConflict(this.productsRepository.merge(product, dto));
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const product = await this.findOne(tenantId, id);
    // Soft delete: past orders keep referencing the product.
    await this.productsRepository.softRemove(product);
  }

  private async saveOrConflict(product: Product): Promise<Product> {
    try {
      return await this.productsRepository.save(product);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === PG_UNIQUE_VIOLATION
      ) {
        throw new ConflictException('A product with this SKU already exists');
      }
      throw error;
    }
  }
}
