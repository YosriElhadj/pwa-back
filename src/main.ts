import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ FIX: Autoriser le frontend Vercel
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://recipe-manager-frontend-three.vercel.app',
      'https://recipe-manager-frontend-lfkjm3h95-yosris-projects-5c0884f5.vercel.app',
      /^https:\/\/recipe-manager-frontend-.*\.vercel\.app$/,  // Accepter tous les déploiements preview
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`🚀 Backend NestJS running on: http://localhost:${port}/api`);
}
bootstrap();