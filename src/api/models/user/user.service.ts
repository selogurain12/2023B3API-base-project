import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { JwtService } from '@nestjs/jwt'; 
import { startOfMonth, endOfMonth, isWeekend, addDays, isMonday, isTuesday, isWednesday, isThursday, isFriday } from 'date-fns';


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {
  }
  
  async createUser(user: User): Promise<{ id: string, username: string, email: string, role: 'Employee' | 'Admin' | 'ProjectManager' }> {
    if (user.password.length < 8) {
      throw new BadRequestException('Le mot de passe doit avoir au moins 8 caractères.');
    }
    if (!user.username || user.username.length < 3) {
        throw new BadRequestException('username should not be empty');
      }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(user.email)) {
      throw new BadRequestException('email must be an email');
    }
    const existingUser = await this.userRepository.findOne({ where: { email: user.email } });
    if (existingUser) {
      throw new Error('L\'adresse e-mail est déjà utilisée.');
    }

    const existingUsername = await this.userRepository.findOne({ where: { username: user.username } });
    if (existingUsername) {
      throw new Error('L\'username est déjà utilisée.');
    }

    user.password = await bcrypt.hash(user.password, 10);
    const createdUser = await this.userRepository.save(user);
    return {
      id: createdUser.id,
      username: createdUser.username,
      email: createdUser.email,
      role: createdUser.role,
    };
  }
  async authenticateUser(email: string, password: string): Promise<string> {
    const user = await this.userRepository.findOne({ where: { email }, select: ['email', 'password', 'id', 'role'] });

    if (!user) {
      throw new UnauthorizedException('L\'utilisateur n\'existe pas.');
    }
  
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Mot de passe incorrect.');
    }
  
    const token = await this.jwtService.signAsync({ sub: user.id, email: user.email, role: user.role });
  
    return token;
  }
  
  
  async getAuthenticatedUser(token: string): Promise<User | undefined> {
    try {
      const payload = await this.jwtService.verifyAsync(token, { secret: 'secretKey' });
      return this.userRepository.findOne({ where: { id: payload.sub } });
    } catch (error) {
      return undefined;
    }
  }
  async findOneById(id: string): Promise<{ id: string, username: string, email: string, role: 'Employee' | 'Admin' | 'ProjectManager' } | undefined> {
    return this.userRepository.findOne({ where: { id } });
  }
  

  async getAllUsers(): Promise<User[]> {
    const users = await this.userRepository.find();
    return users.map((user) =>{
      delete user.password
      return user
    });
  }  
  async getOneUsers(id: string): Promise<User | undefined> {
    const uuidv4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidv4Regex.test(id)) {
      throw new BadRequestException('Invalid UUIDv4 format for user ID.');
    }
    return this.userRepository.findOne({ where: { id } });
  }
  
  async getMealVouchersAmount(userId: string, month: number): Promise<number> {
    const user = await this.getOneUsers(userId);
    const startDate = startOfMonth(new Date(2024, month - 1, 1));
    const endDate = endOfMonth(startDate);

    const workingDays = this.getWorkingDays(startDate, endDate);

    const mealVoucherAmount = workingDays * 8;
    
    return mealVoucherAmount;
  }

  private getWorkingDays(startDate: Date, endDate: Date): number {
    let workingDays = 0;
    let currentDate = startDate;

    while (currentDate <= endDate) {
      if (!isWeekend(currentDate) && this.isWorkingDay(currentDate)) {
        workingDays++;
      }

      currentDate = addDays(currentDate, 1);
    }

    return workingDays;
  }

  private isWorkingDay(date: Date): boolean {
    return isMonday(date) || isTuesday(date) || isWednesday(date) || isThursday(date) || isFriday(date);
  }
}
