import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './api/models/user/user.module';
import { User } from './api/models/user/user.entity';
import { ProjectModule } from './api/models/project-user/project-users.module';
import { ProjectUser } from './api/models/project-user/project-users.entity';
import { Projects } from './api/models/project/projects.module';
import { Project } from './api/models/project/projects.entity';
import { Event } from './api/models/event/event.entity';
import { EventsModule } from './api/models/event/event.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +configService.get<number>('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [User, ProjectUser, Project, Event],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    UserModule,
    ProjectModule,
    Projects,
    EventsModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
