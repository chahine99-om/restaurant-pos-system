import { Injectable, NotFoundException } from '@nestjs/common';
import { StockMovementType } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { AddStockDto } from './dto/add-stock.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@Injectable()
export class StockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll() {
    return this.prisma.stock.findMany({
      include: { ingredient: true },
      orderBy: { ingredient: { name: 'asc' } },
    });
  }

  async getMovements(ingredientId?: string, limit = 50) {
    const where = ingredientId ? { stockId: (await this.getStockByIngredientId(ingredientId)).id } : {};
    return this.prisma.stockMovement.findMany({
      where,
      include: { stock: { include: { ingredient: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /** Supplier delivery - add stock and record movement. */
  async addStock(dto: AddStockDto, userId?: string) {
    const stock = await this.getStockByIngredientId(dto.ingredientId);
    const qty = dto.quantityGrams;
    await this.prisma.$transaction([
      this.prisma.stock.update({
        where: { id: stock.id },
        data: { quantityGrams: { increment: qty } },
      }),
      this.prisma.stockMovement.create({
        data: {
          stockId: stock.id,
          type: StockMovementType.DELIVERY,
          quantityGrams: qty,
          note: dto.note?.trim() ?? null,
        },
      }),
    ]);
    await this.audit.log({
      userId,
      action: 'STOCK_ADD',
      resourceType: 'stock',
      resourceId: stock.id,
      metadata: { ingredientId: dto.ingredientId, quantityGrams: qty },
    });
    return this.prisma.stock.findUnique({
      where: { id: stock.id },
      include: { ingredient: true },
    });
  }

  /** Manual adjustment (loss/waste). */
  async adjustStock(dto: AdjustStockDto, userId?: string) {
    const stock = await this.getStockByIngredientId(dto.ingredientId);
    const qty = dto.quantityGrams;
    const current = await this.prisma.stock.findUnique({ where: { id: stock.id } });
    if (!current) throw new NotFoundException('Stock not found');
    const newQty = Number(current.quantityGrams) + qty;
    if (newQty < 0) throw new NotFoundException('Insufficient stock for this adjustment');
    await this.prisma.$transaction([
      this.prisma.stock.update({
        where: { id: stock.id },
        data: { quantityGrams: newQty },
      }),
      this.prisma.stockMovement.create({
        data: {
          stockId: stock.id,
          type: StockMovementType.ADJUSTMENT,
          quantityGrams: qty,
          note: dto.note?.trim() ?? null,
        },
      }),
    ]);
    await this.audit.log({
      userId,
      action: 'STOCK_ADJUST',
      resourceType: 'stock',
      resourceId: stock.id,
      metadata: { ingredientId: dto.ingredientId, quantityGrams: qty },
    });
    return this.prisma.stock.findUnique({
      where: { id: stock.id },
      include: { ingredient: true },
    });
  }

  /**
   * Deduct ingredients for a sale (called from orders service on confirm).
   * Creates SALE movements and updates stock. Used only internally.
   */
  async deductForSale(
    ingredientQuantities: { ingredientId: string; quantityGrams: number }[],
    orderId: string,
    userId?: string,
  ) {
    for (const { ingredientId, quantityGrams } of ingredientQuantities) {
      const stock = await this.getStockByIngredientId(ingredientId);
      await this.prisma.$transaction([
        this.prisma.stock.update({
          where: { id: stock.id },
          data: { quantityGrams: { decrement: quantityGrams } },
        }),
        this.prisma.stockMovement.create({
          data: {
            stockId: stock.id,
            type: StockMovementType.SALE,
            quantityGrams: -quantityGrams,
            reference: orderId,
          },
        }),
      ]);
    }
    await this.audit.log({
      userId,
      action: 'STOCK_DEDUCT',
      resourceType: 'order',
      resourceId: orderId,
      metadata: { ingredientCount: ingredientQuantities.length },
    });
  }

  /** Low-stock: ingredients below optional threshold (e.g. 1000g). */
  async getLowStock(thresholdGrams = 1000) {
    const stocks = await this.prisma.stock.findMany({
      where: { quantityGrams: { lt: thresholdGrams } },
      include: { ingredient: true },
      orderBy: { quantityGrams: 'asc' },
    });
    return stocks;
  }

  private async getStockByIngredientId(ingredientId: string) {
    const stock = await this.prisma.stock.findUnique({
      where: { ingredientId },
    });
    if (!stock) throw new NotFoundException('Stock not found for this ingredient');
    return stock;
  }
}
