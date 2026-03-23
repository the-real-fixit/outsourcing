import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Security Headers
  app.use(helmet());

  // Strict CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Global Validation Pipe for DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Auto strip non-whitelisted properties
    forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are present
    transform: true, // Auto-transform payloads to be objects typed according to their DTO classes
  }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
