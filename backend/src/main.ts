import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Security Headers
  app.use(helmet());

  // Flexible CORS
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : [];
      if (
        !origin || // Allow non-browser requests (like Postman)
        origin.startsWith('http://localhost') || // Allow local development
        origin.endsWith('.netlify.app') || // Allow all Netlify deployments (including previews)
        allowedOrigins.includes(origin) // Allow specific origins from ENV
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
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
