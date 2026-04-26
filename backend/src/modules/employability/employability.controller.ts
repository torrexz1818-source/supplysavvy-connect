import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { AuthenticatedGuard } from '../../common/auth/authenticated.guard';
import { EmployabilityService } from './employability.service';

type CreateJobBody = {
  title: string;
  description: string;
  skillsRequired: string[];
  experienceRequired: string;
  location?: string;
};

type UpsertTalentProfileBody = {
  description: string;
  skills: string[];
  experience: string;
  certifications?: string[];
  availability?: string;
};

@Controller('employability')
@UseGuards(AuthenticatedGuard)
export class EmployabilityController {
  constructor(private readonly employabilityService: EmployabilityService) {}

  @Get()
  getFeed(
    @CurrentUser() user: { sub: string },
    @Query('search') search?: string,
  ): Promise<unknown> {
    return this.employabilityService.getFeed(user.sub, search);
  }

  @Post('jobs')
  createJob(
    @Body() body: CreateJobBody,
    @CurrentUser() user: { sub: string },
  ): Promise<unknown> {
    return this.employabilityService.createJob(user.sub, body);
  }

  @Patch('jobs/:id')
  updateJob(
    @Param('id') jobId: string,
    @Body() body: CreateJobBody,
    @CurrentUser() user: { sub: string },
  ): Promise<unknown> {
    return this.employabilityService.updateJob(jobId, user.sub, body);
  }

  @Post('jobs/:id/apply')
  applyToJob(
    @Param('id') jobId: string,
    @CurrentUser() user: { sub: string },
  ): Promise<unknown> {
    return this.employabilityService.applyToJob(jobId, user.sub);
  }

  @Post('talent-profile')
  upsertTalentProfile(
    @Body() body: UpsertTalentProfileBody,
    @CurrentUser() user: { sub: string },
  ): Promise<unknown> {
    return this.employabilityService.upsertTalentProfile(user.sub, body);
  }
}
