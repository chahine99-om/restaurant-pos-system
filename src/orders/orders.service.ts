import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentMethod } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { StockService } from '../stock/stock.service';
import { AvailabilityService } from '../availability/availability.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ConfirmOrderDto } from './dto/confirm-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockService: StockService,
    private readonly availabilityService: AvailabilityService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateOrderDto, userId: string) {
    if (!dto.items?.length) throw new BadRequestException('Order must have at least one item');
    const productIds = [...new Set(dto.items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: { recipe: { include: { recipeIngredients: { include: { ingredient: true } } } } },
    });
    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products not found or inactive');
    }
    const order = await this.prisma.order.create({
      data: {
        status: OrderStatus.PENDING,
        userId,
        items: {
          create: await Promise.all(
            dto.items.map(async (item) => {
              const product = products.find((p) => p.id === item.productId)!;
              const canFulfill = await this.availabilityService.canFulfill(item.productId, item.quantity);
              if (!canFulfill) {
                throw new BadRequestException(
                  `Insufficient stock for ${product.name} (requested: ${item.quantity})`,
                );
              }
              return {
                productId: product.id,
                quantity: item.quantity,
                unitPrice: product.price,
              };
            }),
          ),
        },
      },
      include: { items: { include: { product: true } } },
    });
    const total = order.items.reduce(
      (sum, i) => sum + Number(i.unitPrice) * i.quantity,
      0,
    );
    await this.prisma.order.update({
      where: { id: order.id },
      data: { totalAmount: total },
    });
    await this.audit.log({
      userId,
      action: 'ORDER_CREATED',
      resourceType: 'order',
      resourceId: order.id,
      metadata: { itemCount: order.items.length },
    });
    return this.findOne(order.id);
  }

  /** Confirm order: deduct ingredients from stock, set payment and status. */
  async confirm(orderId: string, dto: ConfirmOrderDto, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: { include: { recipe: { include: { recipeIngredients: true } } } } } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order is not pending');
    }
    // Build ingredient deductions: ingredientId -> total grams to deduct
    const deductions: Map<string, number> = new Map();
    for (const item of order.items) {
      const qty = item.quantity;
      for (const ri of item.product.recipe.recipeIngredients) {
        const need = Number(ri.quantityGrams) * qty;
        deductions.set(ri.ingredientId, (deductions.get(ri.ingredientId) ?? 0) + need);
      }
    }
    const arr = Array.from(deductions.entries()).map(([ingredientId, quantityGrams]) => ({
      ingredientId,
      quantityGrams,
    }));
    await this.stockService.deductForSale(arr, orderId, order.userId);
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CONFIRMED,
        paymentMethod: dto.paymentMethod,
      },
    });
    await this.audit.log({
      userId: order.userId,
      action: 'ORDER_CONFIRMED',
      resourceType: 'order',
      resourceId: orderId,
      metadata: { paymentMethod: dto.paymentMethod },
    });
    return this.findOne(orderId);
  }

  async findAll(userId?: string, status?: OrderStatus) {
    const where: { userId?: string; status?: OrderStatus } = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;
    return this.prisma.order.findMany({
      where,
      include: { items: { include: { product: true } }, user: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, user: { select: { fullName: true, email: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }
}
