import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security: HTTP headers (XSS, etc.)
  app.use(helmet());

  // CORS: strict origins only (from env, never *)
  const origins = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? [];
  app.enableCors({ origin: origins.length ? origins : false, credentials: true });

  // Centralized validation (DTOs with class-validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Centralized error handling (no stack/sensitive data in response)
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}
bootstrap();
