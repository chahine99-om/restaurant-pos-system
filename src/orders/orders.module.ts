import { Module } from '@nestjs/common';
import { AvailabilityModule } from '../availability/availability.module';
import { StockModule } from '../stock/stock.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [StockModule, AvailabilityModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
