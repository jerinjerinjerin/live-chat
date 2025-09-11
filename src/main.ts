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

  // hii i am jerin

  app.enableCors({
    origin: 'http://localhost:3000', // Apollo Playground URL (Frontend)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // Allow cookies to be sent
  });

  const port = process.env.PORT ?? 3000; // Ensure it matches Docker exposed port
  await app.listen(port, '0.0.0.0');

  // test for dev origin
}

// live
// http://98.81.2.38:3000/graphql

bootstrap();
