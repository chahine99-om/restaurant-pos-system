import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/roles.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /** POS: list products with availability (cashier + admin). */
  @Get('pos')
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.CASHIER)
  findForPos() {
    return this.productsService.findForPos();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN)
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN)
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
