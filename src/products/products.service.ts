import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AvailabilityService } from '../availability/availability.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly availability: AvailabilityService,
  ) {}

  async create(dto: CreateProductDto) {
    const recipe = await this.prisma.recipe.findUnique({ where: { id: dto.recipeId } });
    if (!recipe) throw new NotFoundException('Recipe not found');
    const existing = await this.prisma.product.findUnique({ where: { recipeId: dto.recipeId } });
    if (existing) throw new ConflictException('A product already uses this recipe');
    return this.prisma.product.create({
      data: {
        name: dto.name.trim(),
        recipeId: dto.recipeId,
        price: dto.price,
      },
      include: { recipe: true },
    });
  }

  async findAll() {
    const products = await this.prisma.product.findMany({
      include: { recipe: { include: { recipeIngredients: { include: { ingredient: true } } } } },
      orderBy: { name: 'asc' },
    });
    const availabilityMap = await this.availability.getAvailabilityMap();
    return products.map((p) => ({
      ...p,
      availableQuantity: availabilityMap[p.id] ?? 0,
    }));
  }

  /** For POS: active products with available quantity only. */
  async findForPos() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      include: { recipe: true },
      orderBy: { name: 'asc' },
    });
    const availabilityMap = await this.availability.getAvailabilityMap();
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      availableQuantity: availabilityMap[p.id] ?? 0,
    }));
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { recipe: { include: { recipeIngredients: { include: { ingredient: true } } } } },
    });
    if (!product) throw new NotFoundException('Product not found');
    const availableQuantity = await this.availability.getAvailableQuantity(id);
    return { ...product, availableQuantity };
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name != null && { name: dto.name.trim() }),
        ...(dto.price != null && { price: dto.price }),
        ...(dto.isActive != null && { isActive: dto.isActive }),
      },
      include: { recipe: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.product.delete({ where: { id } });
    return { deleted: true };
  }
}
