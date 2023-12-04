import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Project } from "./projects.entity";
import { JwtModule } from "@nestjs/jwt";
import { ProjectController } from "./projects.controller";
import { ProjectService } from "./projects.service";
import { User } from "../user/user.entity";
import { jwtConstants } from "../auth/constant";

@Module({
    imports: [TypeOrmModule.forFeature([Project, User]), 
    JwtModule.register({
        global: true,
        secret: jwtConstants.secret,
        signOptions: {expiresIn: '12h'}
      })
],
    providers: [ProjectService],
    controllers: [ProjectController],
    
})
export class Projects {}