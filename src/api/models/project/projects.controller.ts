import { Controller, Post, Body, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { ProjectService } from './projects.service';
import { AuthGuard } from '../auth/auth.guard';
import { Project } from './projects.entity';
import { User } from '../user/user.entity';

@Controller('projects')
@UseGuards(AuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @HttpCode(201)
  async createProject(@Body() body): Promise<{ project: Project, referringEmployee: User }> {
    const { name,referringEmployeeId } = body;
    return this.projectService.createProject(name, referringEmployeeId);
  }
  }
