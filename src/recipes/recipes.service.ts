import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';

@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRecipeDto) {
    const name = dto.name.trim();
    return this.prisma.recipe.create({
      data: {
        name,
        recipeIngredients: {
          create: dto.ingredients.map((i) => ({
            ingredientId: i.ingredientId,
            quantityGrams: i.quantityGrams,
          })),
        },
      },
      include: { recipeIngredients: { include: { ingredient: true } } },
    });
  }

  async findAll() {
    return this.prisma.recipe.findMany({
      include: { recipeIngredients: { include: { ingredient: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      include: { recipeIngredients: { include: { ingredient: true } } },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');
    return recipe;
  }

  async update(id: string, dto: UpdateRecipeDto) {
    await this.findOne(id);
    if (dto.ingredients != null || dto.name != null) {
      const updated = await this.prisma.$transaction(async (tx) => {
        if (dto.ingredients != null) {
          await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
        }
        return tx.recipe.update({
          where: { id },
          data: {
            ...(dto.name != null && { name: dto.name.trim() }),
            ...(dto.ingredients != null && {
              recipeIngredients: {
                create: dto.ingredients.map((i) => ({
                  ingredientId: i.ingredientId,
                  quantityGrams: i.quantityGrams,
                })),
              },
            }),
          },
          include: { recipeIngredients: { include: { ingredient: true } } },
        });
      });
      return updated;
    }
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    const product = await this.prisma.product.findUnique({ where: { recipeId: id } });
    if (product) throw new NotFoundException('Cannot delete recipe: a product is linked to it');
    await this.prisma.recipe.delete({ where: { id } });
    return { deleted: true };
  }
}
