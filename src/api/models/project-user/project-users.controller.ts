// project-user.controller.ts
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ProjectUserService } from './project-users.service';
import { ProjectUser } from './project-users.entity';
import { AuthGuard } from '../auth/auth.guard';

@Controller('project-users')
export class ProjectUserController {
  constructor(private readonly projectUserService: ProjectUserService) {}

  @Post()
  @UseGuards(AuthGuard)
  async assignUserToProject(
    @Body() body: { startDate: Date; endDate: Date; userId: string; projectId: string },
    @Request() req: any, // Assuming you can access user information from the request
  ): Promise<ProjectUser> {
    try {
      const requestingUserId = req.user.id; // Adjust this based on how user information is stored in your request
      return await this.projectUserService.assignUserToProject(
        body.startDate,
        body.endDate,
        body.userId,
        body.projectId,
        requestingUserId,
      );
    } catch (error) {
      // Handle different exceptions here
      throw error;
    }
  }
}
