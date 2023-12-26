import { Controller, Post, Body, UseGuards, Request, Get, Headers, NotFoundException, Param, UnauthorizedException } from '@nestjs/common';
import { ProjectUserService } from './project-users.service';
import { ProjectUser } from './project-users.entity';
import { AuthGuard } from '../auth/auth.guard';
interface ProjectUserAssignmentResponse {
  id: string;
  name: string;
  referringEmployeeId: string;
}

@Controller('project-users')
@UseGuards(AuthGuard)
export class ProjectUserController {
  constructor(private readonly projectUserService: ProjectUserService) {}

  @Post()
  async assignUserToProject(
    @Body() body: { startDate: Date; endDate: Date; userId: string; projectId: string, id:string },
    @Request() req: any,
  ): Promise<ProjectUser> {
    try {
      const requestingUserId = req.user.sub;
      const createdAssignment = await this.projectUserService.assignUserToProject(
        body.id,
        body.startDate,
        body.endDate,
        body.userId,
        body.projectId,
        requestingUserId,
      );
      return createdAssignment;
    } catch (error) {
      throw error;
    }
  }
  @Get()
  async getProjectUserAssignments(@Headers('authorization') authorization: string): Promise<ProjectUserAssignmentResponse[]> {
    const token = authorization.split(' ')[1]; // Extraire le token de l'en-tête Authorization
    return this.projectUserService.getProjectUserAssignments(token);
  }
  @Get(':id')
  async getProjectUserById(@Param('id') id: string, @Request() req: any): Promise<ProjectUser> {
    try {
      const requestingUserId = req.user.sub;
      return this.projectUserService.getProjectUserById(id, requestingUserId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        // Gérer l'exception NotFoundException ici
        // Vous pouvez également laisser NestJS gérer cela et renvoyer une réponse 404 par défaut
        throw error;
      }
      // Gérer d'autres exceptions ici
      throw error;
    }
  }
}
