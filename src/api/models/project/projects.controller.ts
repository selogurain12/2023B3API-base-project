import { Controller, Post, Body, UseGuards, HttpStatus, HttpCode, Get, Req, Param } from '@nestjs/common';
import { ProjectService } from './projects.service';
import { AuthGuard } from '../auth/auth.guard';
import { Project } from './projects.entity';
import { User } from '../user/user.entity';

@Controller('projects')
@UseGuards(AuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  async createProject(@Req() request, @Body() body): Promise<{ id: string, name: string, referringEmployeeId: string, referringEmployee: Omit<User, 'password'> }> {
    const user = request.user.sub;
    const {name, referringEmployeeId} = body
    return this.projectService.createProject(user, name, referringEmployeeId);
  }

  @Get()
  async getProjects(@Req() request): Promise<{ id: string, name: string, referringEmployeeId: string, referringEmployee: { id: string, username: string, email: string, role: "Employee" | "Admin" | "ProjectManager" }}[]> {
    const user: User = request.user;
    const id = request.user.sub;
    return this.projectService.getProjects(user,id);
  }

  @Get(':id')
  async getProjectById(@Req() request, @Param('id') id: string): Promise<{ id: string; name: string; referringEmployeeId: string }> {
    const user: User = request.user;
    return this.projectService.getProjectById(user, id);
  }
}
