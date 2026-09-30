import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import { ACCESS_TOKEN_COOKIE } from './common/guards/auth.guard.js';

async function bootstrap() {
  // rawBody is required to verify webhook signatures byte-for-byte.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  configureApp(app);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('TradeFlow API')
    .setDescription('Multi-tenant B2B wholesale ordering platform')
    .setVersion('1.0')
    .addCookieAuth(ACCESS_TOKEN_COOKIE)
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  await app.listen(app.get(ConfigService).getOrThrow<number>('PORT'));
}
await bootstrap();
