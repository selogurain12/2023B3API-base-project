// src/project-user/project-user.service.ts

import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { ProjectUser } from './project-users.entity';
import { Project } from '../project/projects.entity';
import { User } from '../user/user.entity'; // Import your User entity

@Injectable()
export class ProjectUserService {
  constructor(
    @InjectRepository(ProjectUser)
    private readonly projectUserRepository: Repository<ProjectUser>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async assignUserToProject(
    startDate: Date,
    endDate: Date,
    userId: string,
    projectId: string,
    requestingUserId: string,
  ): Promise<ProjectUser> {
    // Check if the requesting user has the necessary role (replace with your actual role-checking logic)
    const requestingUser = await this.userRepository.findOne({where: {id: requestingUserId}});

    if (!requestingUser || requestingUser.role !== 'Admin' && requestingUser.role !== 'ProjectManager') {
      throw new UnauthorizedException('Vous n\'avez pas les droits pour effectuer cette action.');
    }

    // Vérifier si l'employé est déjà affecté à un projet pour la période demandée
    const existingAssignment = await this.projectUserRepository.findOne({
      where: {
        userId,
        startDate: LessThanOrEqual(startDate),
        endDate: MoreThanOrEqual(endDate),
      },
    });

    if (existingAssignment) {
      throw new ConflictException('L\'employé est déjà affecté à un autre projet pour la période demandée.');
    }

    // Vérifier si le projet existe
    const project = await this.projectRepository.findOne({where: {id: projectId}});

    if (!project) {
      throw new NotFoundException('Projet non trouvé.');
    }

    // Créer une nouvelle affectation
    const newAssignment = this.projectUserRepository.create({
      startDate,
      endDate,
      userId,
      project,
    });

    // Sauvegarder la nouvelle affectation
    const savedAssignment = await this.projectUserRepository.save(newAssignment);

    // Vérifier si l'affectation a bien été sauvegardée
    if (!savedAssignment) {
      throw new NotFoundException('Affectation non trouvée après la sauvegarde.');
    }

    return savedAssignment;
  }
}
