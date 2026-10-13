import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello BrewLite!';
  }

  getHealth(): { status: string; service: string } {
    return { status: 'ok', service: 'brewlite-backend' };
  }
}
