import { Injectable, UnauthorizedException, BadRequestException  } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './projects.entity';
import { User } from '../user/user.entity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createProject(name: string, referringEmployeeId: string): Promise<{ project: Project, referringEmployee: User }> {
    const referringEmployee = await this.userRepository.findOne({
      where: {
        id: referringEmployeeId,
      },
    });

    if (!referringEmployee || !this.isUserAuthorized(referringEmployee)) {
        throw new UnauthorizedException();
      }

    if (name.length < 3) {
      throw new BadRequestException('Project name must contain at least 3 characters');
    }

    const newProject = this.projectRepository.create({
      name,
      referringEmployee
    });
  
    const savedProject = await this.projectRepository.save(newProject);

    return { project: savedProject, referringEmployee };
  }
  private isUserAuthorized(user: User): boolean {
    return user.role.includes('Admin') || user.role.includes('ProjectManager');
  }
}
