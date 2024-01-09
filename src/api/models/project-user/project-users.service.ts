import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, Equal } from 'typeorm';
import { ProjectUser } from './project-users.entity';
import { Project } from '../project/projects.entity';
import { User } from '../user/user.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ProjectUserService {
  constructor(
    @InjectRepository(ProjectUser)
    private readonly projectUserRepository: Repository<ProjectUser>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async assignUserToProject(
    id: string,
    startDate: Date,
    endDate: Date,
    userId: string,
    projectId: string,
    requestingUserId: string,
  ): Promise<ProjectUser & { project: Project & { referringEmployee: User } }> {
    const requestingUser = await this.userRepository.findOne({ where: { id: requestingUserId } });

    const existingAssignment = await this.projectUserRepository.findOne({
      where: [
        {
          userId,
          startDate: LessThanOrEqual(startDate),
          endDate: MoreThanOrEqual(endDate),
        },
        {
          userId,
          startDate: MoreThanOrEqual(startDate),
          endDate: MoreThanOrEqual(endDate),
        },
        {
          userId,
          startDate: LessThanOrEqual(startDate),
          endDate: LessThanOrEqual(endDate),
        },
        {
          userId,
          startDate: Equal(startDate),
          endDate: Equal(endDate),
        }
      ],
      relations: ['user', 'project', 'project.referringEmployee'],
      select: ['id', 'startDate', 'endDate', 'project', 'user', 'userId'],
    });
    if (requestingUser.role !== 'Admin' && requestingUser.role !== 'ProjectManager') {
      throw new UnauthorizedException('Vous n\'avez pas les droits pour effectuer cette action.');
    }   

    if (existingAssignment) {
      throw new ConflictException('L\'employé est déjà affecté à un autre projet pour la période demandée.');
    }

    const project = await this.projectRepository.findOne({ where: { id: projectId } });

    if (!project) {
      throw new NotFoundException('Projet non trouvé.');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'username', 'email', 'role'],
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé.');
    }

    const referringEmployee = await this.userRepository.findOne({
      where: { id: project.referringEmployeeId },
      select: ['id', 'username', 'email', 'role'],
    });

    const newAssignment = this.projectUserRepository.create({
      id,
      startDate,
      endDate,
      userId,
      project,
      user,
    });

    const savedAssignment = await this.projectUserRepository.save(newAssignment);

    if (!savedAssignment) {
      throw new NotFoundException('Affectation non trouvée après la sauvegarde.');
    }

    return { ...savedAssignment, project: { ...project, referringEmployee } };
  }

  async getProjectUserAssignments(token: string): Promise<{ id: string, startDate: Date, endDate: Date, userId: string, projectId: string }[]> {
    const decodedToken = this.jwtService.decode(token) as { sub: string };

    const user = await this.userRepository.findOne({ where: { id: decodedToken.sub } });

    if (!user) {
        throw new NotFoundException('Utilisateur non trouvé.');
    }

    if (user.role === 'Employee') {
        const userAssignments = await this.projectUserRepository.find({ where: { userId: user.id }, relations: ['project'] });

        const result = userAssignments.map(assignment => ({
            id: assignment.project.id,
            startDate: assignment.startDate, 
            endDate: assignment.endDate,
            userId: assignment.userId,
            projectId: assignment.projectId,
        }));
        return result;
    } else if (user.role === 'Admin' || user.role === 'ProjectManager') {
        const allAssignments = await this.projectUserRepository.find({ relations: ['user', 'project'] });

        const result = allAssignments.map(assignment => ({
            id: assignment.project.id,
            startDate: assignment.startDate,
            endDate: assignment.endDate,
            userId: assignment.userId,
            projectId: assignment.projectId,
        }));
        return result;
    } else {
        throw new UnauthorizedException('Vous n\'avez pas les droits pour effectuer cette action.');
    }
}
  
  async getProjectUserById(projectUserId: string, requestingUserId: string): Promise<ProjectUser> {
    const requestingUser = await this.userRepository.findOne({ where: { id: requestingUserId } });

    if (!requestingUser) {
      throw new UnauthorizedException('Utilisateur non trouvé.');
    }

    if (requestingUser.role === 'Employee') {
      const projectUser = await this.projectUserRepository.findOne({
        where: { id: projectUserId, userId: requestingUser.id },
        select: [
          'id',
          'startDate',
          'endDate',
          'projectId',
          'userId',
        ],
      });


      return projectUser;
    } else if (requestingUser.role === 'Admin' || requestingUser.role === 'ProjectManager') {
      const projectUser = await this.projectUserRepository.findOne({
        where: { id: projectUserId },
        select: [
          'id',
          'startDate',
          'endDate',
          'projectId',
          'userId',
        ],
      });
      if (projectUser?.user) {
        delete projectUser.user.password;
      }
      return projectUser;
    } else {
      throw new UnauthorizedException('Vous n\'avez pas les droits pour effectuer cette action.');
    }
  }
}