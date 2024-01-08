// create-event.dto.ts

import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';

enum EventStatus {
  Pending = 'Pending',
  Accepted = 'Accepted',
  Declined = 'Declined',
}

enum EventType {
  RemoteWork = 'RemoteWork',
  PaidLeave = 'PaidLeave',
}

export class CreateEventDto {
  @IsDate()
  date: Date;

  @IsOptional()
  @IsString()
  eventDescription?: string;

  @IsEnum(EventType)
  eventType: 'RemoteWork' | 'PaidLeave';

  @IsEnum(EventStatus)
  eventStatus?: 'Pending' | 'Accepted' | 'Declined' = 'Pending';
}
