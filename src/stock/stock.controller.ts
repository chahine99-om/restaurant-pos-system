import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
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
    const parsed = limit ? parseInt(limit, 10) : 50;
    const safeLimit = Number.isNaN(parsed) ? 50 : Math.min(Math.max(1, parsed), 100);
    return this.stockService.getMovements(ingredientId, safeLimit);
  }

  @Get('low')
  getLowStock(@Query('threshold') threshold?: string) {
    const parsed = threshold ? parseFloat(threshold) : 1000;
    const safeThreshold = Number.isNaN(parsed) ? 1000 : Math.min(Math.max(0, parsed), 1_000_000);
    return this.stockService.getLowStock(safeThreshold);
  }

  @Post('add')
  addStock(@Body() dto: AddStockDto, @Req() req: { user: { id: string } }) {
    return this.stockService.addStock(dto, req.user.id);
  }

  @Post('adjust')
  adjustStock(@Body() dto: AdjustStockDto, @Req() req: { user: { id: string } }) {
    return this.stockService.adjustStock(dto, req.user.id);
  }
}
