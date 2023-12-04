import { Controller,UseGuards,  Get, Post, Body, Request, Response, Res, HttpException, Param, NotFoundException } from '@nestjs/common';
import { UsersService } from './user.service';
import { User } from './user.entity'; 
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '../auth/auth.guard';

@Controller('users')
export class AuthController {
  constructor(private readonly usersService: UsersService, private readonly jwtService : JwtService) {}

  @Post('auth/sign-up')
  async signUp(@Body() user: User): Promise<{ id: string, username: string, email: string, role: 'Employee' | 'Admin' | 'ProjectManager' }> {
    const createdUser = await this.usersService.createUser(user);
    return {
      id: createdUser.id,
      username: createdUser.username,
      email: createdUser.email,
      role: createdUser.role,
    };
  }
  @Post('auth/login')
  async login(@Body() credentials: { email: string, password: string }): Promise<{ access_token: string }> {
    const token = await this.usersService.authenticateUser(credentials.email, credentials.password);
    return { access_token: token };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getProfile(@Request() req): Promise<{ id: string, username: string, email: string, role: 'Employee' | 'Admin' | 'ProjectManager' }> {
    const userId = req.user.sub;
    const user = await this.usersService.findOneById(userId);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
  }

@Get()
@UseGuards(AuthGuard)
async getUsers(): Promise<User[]>{
     return this.usersService.getAllUsers();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async getUserById(@Param('id') id: string): Promise<User> {
    const user = await this.usersService.getOneUsers(id);
  
    if (user) {
      delete user.password
      return user
    } else {
      throw new NotFoundException('Utilisateur non trouvé')
    }
  }
  
}