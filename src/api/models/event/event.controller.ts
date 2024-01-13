import { Body, Controller, Get, Param, Post, Request, UseGuards, Req } from '@nestjs/common';
import { EventsService } from './event.service';
import { AuthGuard } from '../auth/auth.guard';
import { Event } from './event.entity';
import { CreateEventDto } from './create-dto.dto';
import { User } from '../user/user.entity';
import { ProjectUser } from '../project-user/project-users.entity';

interface MyRequest {
  user: {
    id: string;
    email: string;
    role: 'Employee' | 'Admin' | 'ProjectManager';
    username: string;
    password: string;
    projectUsers: ProjectUser[];
  };
}

@Controller('events')
@UseGuards(AuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  async createEvent(@Body() createEventDto: CreateEventDto, @Req() req): Promise<Event> {
    const userId = req.user.sub;
    return await this.eventsService.createEvent(createEventDto, userId);
  }

  @Get()
  async getAllEvents(): Promise<Event[]> {
    return this.eventsService.getAllEvents();
  }

  @Get(':id')
  async getEventById(@Param('id') id: string): Promise<Event> {
    return await this.eventsService.getEventById(id);
  }

  @Post(':id/validate')
  async validateEvent(@Param('id') id: string, @Request() req: MyRequest): Promise<Event> {
    const user: User = req.user;
    return this.eventsService.validateEvent(id, user);
  }

  @Post(':id/decline')
  async declineEvent(@Param('id') id: string, @Request() req: MyRequest): Promise<Event> {
    const user: User = req.user;
    return this.eventsService.declineEvent(id, user);
  }
}
