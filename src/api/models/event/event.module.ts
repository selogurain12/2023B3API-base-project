import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { User } from "../user/user.entity";
import { jwtConstants } from "../auth/constant";
import { ProjectUser } from "../project-user/project-users.entity";
import { Event } from "./event.entity";
import { EventsService } from "./event.service";
import { EventsController } from "./event.controller";

@Module({
    imports: [TypeOrmModule.forFeature([Event, ProjectUser, User]), 
    JwtModule.register({
        global: true,
        secret: jwtConstants.secret,
        signOptions: {expiresIn: '12h'}
      })
],
    providers: [EventsService],
    controllers: [EventsController],
    
})
export class EventsModule {}