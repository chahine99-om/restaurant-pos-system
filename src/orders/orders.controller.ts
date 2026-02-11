import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { OrderStatus, RoleName } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/roles.decorator';
import { ConfirmOrderDto } from './dto/confirm-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

interface JwtUser { id: string; role: RoleName }

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.CASHIER)
  create(@Body() dto: CreateOrderDto, @Req() req: { user: JwtUser }) {
    return this.ordersService.create(dto, req.user.id);
  }

  @Post(':id/confirm')
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.CASHIER)
  confirm(@Param('id') id: string, @Body() dto: ConfirmOrderDto, @Req() req: { user: JwtUser }) {
    return this.ordersService.confirm(id, dto, req.user.id);
  }

  @Get()
  findAll(@Query('status') status?: OrderStatus, @Req() req?: { user: JwtUser }) {
    const userId = req?.user?.role === RoleName.CASHIER ? req.user.id : undefined;
    return this.ordersService.findAll(userId, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }
}
