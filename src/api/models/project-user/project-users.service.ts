// src/project-user/project-user.service.ts

import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
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

    // Return the entire structure with referringEmployee
    return { ...savedAssignment, project: { ...project, referringEmployee } };
  }
  async getProjectUserAssignments(token: string): Promise<{ id: string, name: string, referringEmployeeId: string }[]> {
    // Décoder le token pour obtenir l'ID de l'utilisateur
    const decodedToken = this.jwtService.decode(token) as { sub: string };

    // Trouver l'utilisateur dans la base de données
    const user = await this.userRepository.findOne({ where: { id: decodedToken.sub } });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé.');
    }

    // Vérifier le rôle de l'utilisateur
    if (user.role === 'Employee') {
      // Si l'utilisateur est un employé, renvoyer seulement ses propres assignations
      const userAssignments = await this.projectUserRepository.find({ where: { userId: user.id }, relations: ['project'] });

      // Extraire les propriétés nécessaires pour le schéma JSON
      const result = userAssignments.map(assignment => ({
        id: assignment.project.id,
        name: assignment.project.name,
        referringEmployeeId: assignment.project.referringEmployeeId,
      }));
      return result;
    } else if (user.role === 'Admin' || user.role === 'ProjectManager') {
      // Si l'utilisateur est un administrateur ou un chef de projet, renvoyer toutes les assignations
      const allAssignments = await this.projectUserRepository.find({ relations: ['user', 'project'] });

      // Extraire les propriétés nécessaires pour le schéma JSON
      const result = allAssignments.map(assignment => ({
        id: assignment.project.id,
        name: assignment.project.name,
        referringEmployeeId: assignment.project.referringEmployeeId,
      }));
      return result;
    } else {
      // Si l'utilisateur a un rôle non autorisé, lancer une exception UnauthorizedException
      throw new UnauthorizedException('Vous n\'avez pas les droits pour effectuer cette action.');
    }
  }
  
  async getProjectUserById(projectUserId: string, requestingUserId: string): Promise<ProjectUser> {
    const requestingUser = await this.userRepository.findOne({ where: { id: requestingUserId } });

    if (!requestingUser) {
      throw new UnauthorizedException('Utilisateur non trouvé.');
    }

    // Vérifiez si l'utilisateur a le droit d'accéder à cette ressource

    if (requestingUser.role === 'Employee') {
      // Si l'utilisateur est un employé, il ne peut voir que ses propres assignations
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
      // Si l'utilisateur est un administrateur ou un chef de projet, il peut voir toutes les assignations
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

      // Exclude the password field from the user entity
      if (projectUser?.user) {
        delete projectUser.user.password;
      }

      return projectUser;
    } else {
      // Si l'utilisateur a un rôle non autorisé, lancez une exception UnauthorizedException
      throw new UnauthorizedException('Vous n\'avez pas les droits pour effectuer cette action.');
    }
  }
}