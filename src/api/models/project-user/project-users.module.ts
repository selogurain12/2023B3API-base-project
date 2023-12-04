import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProjectUser } from "./project-users.entity";
import { JwtModule } from "@nestjs/jwt";
import { ProjectUserController } from "./project-users.controller";
import { ProjectUserService } from "./project-users.service";
import { User } from "../user/user.entity";
import { Project } from "../project/projects.entity";
import { jwtConstants } from "../auth/constant";

@Module({
    imports: [TypeOrmModule.forFeature([ProjectUser, User, Project]), 
    JwtModule.register({
        global: true,
        secret: jwtConstants.secret,
        signOptions: {expiresIn: '12h'}
      })
],
    controllers: [ProjectUserController],
    providers: [ProjectUserService],
})
export class ProjectModule {}