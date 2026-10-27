import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RewardsService } from './rewards.service.js';
import { CurrentUser, JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { AuthUser } from '../auth/auth.types.js';

@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewards: RewardsService) {}

  @Get()
  list() {
    return this.rewards.list();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return this.rewards.me(user.id);
  }

  @Post(':id/redeem')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  redeem(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.rewards.redeem(user.id, id);
  }
}
