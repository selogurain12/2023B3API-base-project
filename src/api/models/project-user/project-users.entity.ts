import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from '../project/projects.entity';
import { User } from '../user/user.entity';

@Entity()
export class ProjectUser {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    projectId: string;

    @Column({ type: 'uuid' })
    userId: string;

    @ManyToOne(() => Project, project => project.projectUsers)
    @JoinColumn({ name: 'projectId' })
    project: Project;

    @ManyToOne(() => User, user => user.id)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'timestamp' })
    startDate: Date;

    @Column({ type: 'timestamp' })
    endDate: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
