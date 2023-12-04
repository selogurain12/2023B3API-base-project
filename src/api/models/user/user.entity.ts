import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique, OneToMany } from 'typeorm';
import { ProjectUser } from '../project-user/project-users.entity';

@Entity()
@Unique(['username'])
@Unique(['email'])
export class User {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    username: string;

    @Column()
    email: string;

    @Column()
    password: string;

    @Column({ default: 'Employee' })
    role: 'Employee' | 'Admin' | 'ProjectManager';

    @OneToMany(() => ProjectUser, projectUser => projectUser.user)
    projectUsers: ProjectUser[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
