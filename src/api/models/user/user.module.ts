import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './user.controller';
import { UsersService } from './user.service';
import { User } from './user.entity';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../auth/constant';


@Module({
  imports: [
  TypeOrmModule.forFeature([User]), 
  JwtModule.register({
    global: true,
    secret: jwtConstants.secret,
    signOptions: {expiresIn: '12h'}
  })
],
  controllers: [AuthController],
  providers: [UsersService],
})
export class UserModule {}
