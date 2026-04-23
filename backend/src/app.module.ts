import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './modules/admin/admin.module';
import { AgentsModule } from './modules/agents/agents.module';
import { AuthModule } from './modules/auth/auth.module';
import { DatabaseModule } from './modules/database/database.module';
import { EmployabilityModule } from './modules/employability/employability.module';
import { ExpertsModule } from './modules/experts/experts.module';
import { MessagesModule } from './modules/messages/messages.module';
import { NewsModule } from './modules/news/news.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PostsModule } from './modules/posts/posts.module';
import { StatsModule } from './modules/stats/stats.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    DatabaseModule,
    AgentsModule,
    AuthModule,
    UsersModule,
    EmployabilityModule,
    PostsModule,
    NewsModule,
    ExpertsModule,
    MessagesModule,
    AdminModule,
    NotificationsModule,
    StatsModule,
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
