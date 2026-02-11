import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Dish availability = min(availableStock / recipeQuantity) across all ingredients.
 * Example: Chicken 6000g/300g=20, Tomatoes 300g/20g=15 → available dishes = 15.
 */
@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns how many dishes of this product can be made with current stock (floor). */
  async getAvailableQuantity(productId: string): Promise<number> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        recipe: {
          include: {
            recipeIngredients: { include: { ingredient: { include: { stock: true } } } },
          },
        },
      },
    });
    if (!product?.recipe?.recipeIngredients?.length) return 0;
    let minDishes = Number.MAX_SAFE_INTEGER;
    for (const ri of product.recipe.recipeIngredients) {
      const stockQty = ri.ingredient.stock?.quantityGrams ?? 0;
      const req = ri.quantityGrams;
      if (Number(req) <= 0) continue;
      const num = Number(stockQty) / Number(req);
      const floor = Math.floor(num);
      if (floor < minDishes) minDishes = floor;
    }
    return minDishes === Number.MAX_SAFE_INTEGER ? 0 : Math.max(0, minDishes);
  }

  /** Returns available quantity for all active products (for POS). */
  async getAvailabilityMap(): Promise<Record<string, number>> {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      select: { id: true },
    });
    const map: Record<string, number> = {};
    for (const p of products) {
      map[p.id] = await this.getAvailableQuantity(p.id);
    }
    return map;
  }

  /** Check if we can fulfill quantity of a product (for order validation). */
  async canFulfill(productId: string, quantity: number): Promise<boolean> {
    const available = await this.getAvailableQuantity(productId);
    return available >= quantity;
  }
}
