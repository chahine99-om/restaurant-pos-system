import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security: HTTP headers (XSS, etc.)
  app.use(helmet());

  // CORS: strict origins only (from env). Dev fallback so login works without .env.
  const fromEnv = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? [];
  const origins =
    fromEnv.length > 0 ? fromEnv : ['http://localhost:3000', 'http://localhost:5173'];
  app.enableCors({ origin: origins, credentials: true });

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
