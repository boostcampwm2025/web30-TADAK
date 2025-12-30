import 'tsconfig-paths/register';

import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ConfigService를 사용하여 환경변수 가져오기
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;

  const config = new DocumentBuilder()
    .setTitle('API Docs')
    .setDescription('Backend API document')
    .setVersion('1.0')
    .build();

  // Swagger 문서 생성 방식을 factory 함수로 제공
  const documentFactory = () => SwaggerModule.createDocument(app, config);

  // 'api-docs' 경로에 Swagger UI 설정
  SwaggerModule.setup('api-docs', app, documentFactory);

  await app.listen(port);
  console.warn(`Server is running on: http://localhost:${port}`);
  console.warn(`Swagger API Docs: http://localhost:${port}/api-docs`);
}

void bootstrap();
