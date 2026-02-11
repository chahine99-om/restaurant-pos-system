import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/roles.decorator';
import { AddStockDto } from './dto/add-stock.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { StockService } from './stock.service';

@Controller('stock')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  findAll() {
    return this.stockService.findAll();
  }

  @Get('movements')
  getMovements(@Query('ingredientId') ingredientId?: string, @Query('limit') limit?: string) {
    return this.stockService.getMovements(ingredientId, limit ? parseInt(limit, 10) : 50);
  }

  @Get('low')
  getLowStock(@Query('threshold') threshold?: string) {
    const thresholdGrams = threshold ? parseFloat(threshold) : 1000;
    return this.stockService.getLowStock(thresholdGrams);
  }

  @Post('add')
  addStock(@Body() dto: AddStockDto) {
    return this.stockService.addStock(dto);
  }

  @Post('adjust')
  adjustStock(@Body() dto: AdjustStockDto) {
    return this.stockService.adjustStock(dto);
  }
}
