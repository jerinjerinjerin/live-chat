import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true, // throw error for unknown fields
      transform: true, // auto-transform payloads to DTO instances
    }),
  );
  const port = process.env.PORT ?? 3000; // Ensure it matches Docker exposed port
  await app.listen(port, '0.0.0.0');
}

bootstrap();
