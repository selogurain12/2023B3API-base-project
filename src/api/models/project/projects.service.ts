import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Project } from './projects.entity';
import { User } from '../user/user.entity';
import { ProjectUser } from '../project-user/project-users.entity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ProjectUser)
    private readonly projectUsersRepository: Repository<ProjectUser>,

  ) {}

  async createProject(user: string, name: string, referringEmployeeId: string): Promise<{ id: string, name: string, referringEmployeeId: string, referringEmployee: Omit<User, 'password'> }> {
    const userrole = await this.userRepository.findOne({
      where:{
        id: user,
      }
    })
    if (userrole.role==="Employee" || userrole.role==="ProjectManager"){
      throw new UnauthorizedException("Utilisateur non autorisé");
    }
    const referringEmployee = await this.userRepository.findOne({
      where: {
        id: referringEmployeeId,
      },
    });
    if (referringEmployee.role === "Employee" ) {
      throw new UnauthorizedException(referringEmployee.role);
    }
    if (name.length < 3) {
      throw new BadRequestException('Project name must contain at least 3 characters');
    }
  
    const newProject = this.projectRepository.create({
      name,
      referringEmployee,
    });
  
    const savedProject = await this.projectRepository.save(newProject);
  
    // Exclude the 'password' field from the referringEmployee object
    const { password, ...referringEmployeeWithoutPassword } = referringEmployee;
  
    return { name, referringEmployeeId, id: savedProject.id, referringEmployee: referringEmployeeWithoutPassword };
  }
  

  async getProjects(user: User, id:string): Promise<{ id: string, name: string, referringEmployeeId: string, referringEmployee: { id: string, username: string, email: string, role: "Employee" | "Admin" | "ProjectManager" }}[]> {
    if (user.role === 'Employee') {
      const projectUsers = await this.projectUsersRepository.find({
        where: {
          userId: id,
        },
      });

      const projectIds = projectUsers.map((pu) => pu.projectId)
      return this.projectRepository.find({
        where: {
          id: In(projectIds)
        }, 
        relations: {
          referringEmployee: true
        }
      })
    } else {
      return this.projectRepository.find({
        relations: {
          referringEmployee: true
        }
      });
    }
  }
  async getProjectById(user: User, id: string): Promise<{ id: string; name: string; referringEmployeeId: string }> {
    if (user.role === 'Employee') {
        const projectUsers = await this.projectUsersRepository.find({
            where: {
                userId: user.id,
            },
        });

        const projectIds = projectUsers.map((pu) => pu.projectId);

        // Vérifier si le projet demandé fait partie des projets associés à l'utilisateur
        if (!projectIds.includes(id)) {
            throw new ForbiddenException('You do not have permission to access this project');
        }

        // Récupérer le projet demandé en incluant les relations nécessaires
        const project = await this.projectRepository.findOne({
            where: { id },
            select: ['id', 'name', 'referringEmployeeId'],
        });

        // Si le projet n'est pas trouvé, lancer une exception NotFound
        if (!project) {
            throw new NotFoundException(`Project with ID ${id} not found`);
        }

        return {
            id: project.id,
            name: project.name,
            referringEmployeeId: project.referringEmployeeId,
        };
    } else if (user.role === 'Admin' || user.role === 'ProjectManager') {
        // Si l'utilisateur est un administrateur ou un chef de projet, renvoyer le projet demandé avec les relations
        const project = await this.projectRepository.findOne({
            where: { id },
            select: ['id', 'name', 'referringEmployeeId'],
        });

        // Si le projet n'est pas trouvé, lancer une exception NotFound
        if (!project) {
            throw new NotFoundException(`Project with ID ${id} not found`);
        }

        return {
            id: project.id,
            name: project.name,
            referringEmployeeId: project.referringEmployeeId,
        };
    } else {
        // Si le rôle de l'utilisateur n'est pas géré, lancer une exception d'interdiction
        throw new ForbiddenException('Unauthorized role');
    }
}
}
