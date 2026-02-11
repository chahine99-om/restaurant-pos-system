import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';

@Injectable()
export class IngredientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateIngredientDto) {
    const name = dto.name.trim();
    const ingredient = await this.prisma.ingredient.create({
      data: { name, unit: dto.unit.trim() },
    });
    await this.prisma.stock.create({
      data: { ingredientId: ingredient.id, quantityGrams: 0 },
    });
    return this.prisma.ingredient.findUnique({
      where: { id: ingredient.id },
      include: { stock: true },
    });
  }

  async findAll() {
    return this.prisma.ingredient.findMany({
      include: { stock: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id },
      include: { stock: true },
    });
    if (!ingredient) throw new NotFoundException('Ingredient not found');
    return ingredient;
  }

  async update(id: string, dto: UpdateIngredientDto) {
    await this.findOne(id);
    return this.prisma.ingredient.update({
      where: { id },
      data: {
        ...(dto.name != null && { name: dto.name.trim() }),
        ...(dto.unit != null && { unit: dto.unit.trim() }),
      },
      include: { stock: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.ingredient.delete({ where: { id } });
    return { deleted: true };
  }
}
