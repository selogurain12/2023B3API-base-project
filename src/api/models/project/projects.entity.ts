import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { ProjectUser } from '../project-user/project-users.entity';

@Entity()
export class Project {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ type: 'uuid' })
    referringEmployeeId: string;

    @ManyToOne(() => User, user => user.id)
    @JoinColumn({ name: 'referringEmployeeId' })
    referringEmployee: User;

    @OneToMany(() => ProjectUser, projectUser => projectUser.project)
    projectUsers: ProjectUser[];
}
