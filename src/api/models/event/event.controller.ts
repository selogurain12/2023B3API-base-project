// events.controller.ts

import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { EventsService } from './event.service';
import { AuthGuard } from '../auth/auth.guard';
import { Event } from './event.entity';
import { CreateEventDto } from './create-dto.dto';

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
  async getEventById(@Param('id') id: string) {
    return await this.eventsService.getEventById(id);
  }

  @Post(':id/validate')
  async validateEvent(@Param('id') id: string, @Req() req): Promise<Event> {
    const userId = req.user.sub;
    return await this.eventsService.validateEvent(id, userId);
  }

  @Post(':id/decline')
  async declineEvent(@Param('id') id: string, @Req() req): Promise<Event> {
    const user = req.user;
    return await this.eventsService.declineEvent(id, user);
  }
}
