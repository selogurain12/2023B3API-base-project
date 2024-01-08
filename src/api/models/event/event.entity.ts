import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique, OneToMany } from 'typeorm';
import { ProjectUser } from '../project-user/project-users.entity';

@Entity()
export class Event {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    date: Date;

    @Column({ default: 'Pending' })
    eventStatus: 'Pending' | 'Accepted' | 'Declined';

    @Column()
    eventType: 'RemoteWork' | 'PaidLeave';

    @Column()
    eventDescription: string;

    @Column()
    userId: string;
}
