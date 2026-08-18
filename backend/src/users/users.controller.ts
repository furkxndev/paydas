import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PlatformRole } from '../common/enums';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: User): User {
    return user;
  }

  @Patch('me')
  updateMe(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<User> {
    return this.usersService.updateProfile(userId, dto);
  }

  /**
   * Kullanıcının kendi hesabını kalıcı olarak silmesi.
   * Şifre teyidi ister; son yönetici sistemi sahipsiz bırakamaz.
   */
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMe(
    @CurrentUser() user: User,
    @Body() dto: DeleteAccountDto,
  ): Promise<void> {
    if (!(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new BadRequestException('Şifreniz hatalı.');
    }
    if (user.platformRole === PlatformRole.ADMIN) {
      const adminCount = await this.usersService.countAdmins();
      if (adminCount <= 1) {
        throw new ForbiddenException(
          'Sistemdeki tek yönetici sizsiniz. Önce başka bir kullanıcıyı yönetici yapın.',
        );
      }
    }
    await this.usersService.deleteAccount(user.id);
  }
}
