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

    // Vérifier si l'événement peut être validé
    this.checkEventAuthorization(event, user);

    // Valider l'événement
    event.eventStatus = 'Accepted';
    const savedEvent = await this.eventsRepository.save(event);

    // Retourner le statut mis à jour de l'événement
    return savedEvent;
  }

  async declineEvent(id: string, user: User): Promise<Event> {
    const event = await this.getEventById(id);

    // Vérifier si l'événement peut être refusé
    this.checkEventAuthorization(event, user);

    // Refuser l'événement
    event.eventStatus = 'Declined';
    const savedEvent = await this.eventsRepository.save(event);

    // Retourner le statut mis à jour de l'événement
    return savedEvent;
  }

  private async checkEventAuthorization(event: Event, user: User): Promise<void> {
    if (event.eventStatus === 'Accepted' || event.eventStatus === 'Declined') {
      throw new UnauthorizedException("Impossible d'altérer le statut d'un projet déjà validé ou refusé.");
    }
  
    if (user.role === 'Admin') {
      return; // Les administrateurs peuvent valider n'importe quelle demande
    }
  
    const isUserInProject = await this.isUserInProjectOnDate(user.id, event.date);
    if (!isUserInProject) {
      throw new UnauthorizedException("Vous n'êtes pas rattaché à un projet le jour de l'événement.");
    }
  
    const isProjectLead = await this.isProjectLeadForDate(user.id, event.date);
    if (!isProjectLead) {
      throw new UnauthorizedException("Vous n'avez pas le droit de traiter cet événement.");
    }
  }

  private async isUserInProjectOnDate(userId: string, date: Date): Promise<boolean> {
    const startOfDayDate = startOfDay(date);
    const endOfDayDate = endOfDay(date);

    const projectUser = await this.projectUsersRepository.findOne({
      where: {
        userId,
        startDate: MoreThanOrEqual(startOfDayDate),
        endDate: MoreThanOrEqual(endOfDayDate),
      },
    });
    console.log(projectUser)
    return !!projectUser;
  }

  private async isProjectLeadForDate(userId: string, date: Date): Promise<boolean> {
    const startOfDayDate = startOfDay(date);
    const endOfDayDate = endOfDay(date);

    const projectUser = await this.projectUsersRepository.findOne({
      where: {
        userId,
        startDate: MoreThanOrEqual(startOfDayDate),
        endDate: MoreThanOrEqual(endOfDayDate),
      },
    });
    console.log(projectUser)
    return !!projectUser;
  }
}
