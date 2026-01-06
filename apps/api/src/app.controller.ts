import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return 'Hello World!';
  }

  @Get('test')
  getTest(): string {
    return 'This is a test endpoint';
  }
}
