// events.service.ts

import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Event } from './event.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { CreateEventDto } from './create-dto.dto';
import { startOfWeek, startOfDay, endOfDay } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../user/user.entity';
import { ProjectUser } from '../project-user/project-users.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
    @InjectRepository(ProjectUser)
    private readonly projectUsersRepository: Repository<ProjectUser>,
  ) {}

  async getAllEvents(): Promise<Event[]> {
    return this.eventsRepository.find();
  }

  async createEvent(createEvent: CreateEventDto, userId: string): Promise<Event> {
    const id = uuidv4();
    const event = this.eventsRepository.create({
      id,
      ...createEvent,
      userId: userId,
      eventStatus: createEvent.eventType === 'PaidLeave' ? 'Pending' : 'Accepted',
      eventDescription: createEvent.eventDescription,
    });

    const existingEventsOnSameDay = await this.eventsRepository.find({
      where: {
        userId,
        date: MoreThanOrEqual(createEvent.date),
      },
    });

    if (existingEventsOnSameDay.length > 0) {
      throw new UnauthorizedException("Vous avez déjà un événement pour cette journée.");
    }

    if (existingEventsOnSameDay.length >= 2) {
      throw new UnauthorizedException("Il est impossible d'avoir deux évènements sur la même journée.");
    }

    if (createEvent.eventType === 'RemoteWork') {
      const remoteWorkEventsThisWeek = await this.eventsRepository.find({
        where: {
          userId,
          eventType: 'RemoteWork',
          date: MoreThanOrEqual(startOfWeek(createEvent.date)),
        },
      });

      if (remoteWorkEventsThisWeek.length >= 2) {
        throw new UnauthorizedException("Il est impossible de se mettre en télétravail plus de deux jours par semaine.");
      }
    }

    return await this.eventsRepository.save(event);
  }

  async getEventById(id: string): Promise<Event> {
    const event = await this.eventsRepository.findOne({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException("Événement non trouvé.");
    }

    return event;
  }

  async validateEvent(id: string, user: User): Promise<Event> {
    const event = await this.getEventById(id);

    // Check event authorization
    this.checkEventAuthorization(event, user);

    // Validate the event
    event.eventStatus = 'Accepted';
    return await this.eventsRepository.save(event);
  }

  async declineEvent(id: string, user: User): Promise<Event> {
    const event = await this.getEventById(id);

    // Check event authorization
    this.checkEventAuthorization(event, user);

    // Decline the event
    event.eventStatus = 'Declined';
    return await this.eventsRepository.save(event);
  }

  private checkEventAuthorization(event: Event, user: User): void {
    // Check if the event is already accepted or declined
    if (event.eventStatus === 'Accepted' || event.eventStatus === 'Declined') {
      throw new UnauthorizedException("Impossible d'altérer le statut d'un projet déjà validé ou refusé.");
    }

    // Check if the user is an administrator
    if (user.role === 'Admin') {
      return; // Admins can validate any request
    }

    // Check if the user is attached to a project on the day of the event
    const isUserInProject = false; // Replace with your logic to check if the user is in a project
    if (!isUserInProject) {
      throw new UnauthorizedException("Vous n'êtes pas rattaché à un projet le jour de l'événement.");
    }

    // Check if the project lead can validate or decline the event
    const isProjectLead = false; // Replace with your logic to check if the user is a project lead
    if (!isProjectLead || event.userId !== user.id) {
      throw new UnauthorizedException("Vous n'avez pas le droit de traiter cet événement.");
    }
  }
}
