import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/domain/user.model';
import { UserRole } from '../users/domain/user-role.enum';
import { UsersService } from '../users/users.service';

type EmployabilityJobRecord = {
  id: string;
  authorId: string;
  title: string;
  description: string;
  skillsRequired: string[];
  experienceRequired: string;
  location: string;
  createdAt: Date;
  updatedAt: Date;
};

type EmployabilityTalentProfileRecord = {
  id: string;
  userId: string;
  description: string;
  skills: string[];
  experience: string;
  certifications: string[];
  availability: string;
  createdAt: Date;
  updatedAt: Date;
};

type EmployabilityApplicationRecord = {
  id: string;
  jobId: string;
  applicantId: string;
  createdAt: Date;
  updatedAt: Date;
};

type PublicEmployabilityUser = {
  id: string;
  fullName: string;
  company: string;
  position: string;
  role: string;
};

type EmployabilityJobResponse = {
  id: string;
  title: string;
  company: string;
  author: PublicEmployabilityUser;
  description: string;
  skillsRequired: string[];
  experienceRequired: string;
  location: string;
  applicants: number;
  hasApplied: boolean;
  createdAt: string;
  isOwner?: boolean;
};

type EmployabilityTalentProfileResponse = {
  id: string;
  user: PublicEmployabilityUser;
  headline: string;
  description: string;
  skills: string[];
  experience: string;
  certifications: string[];
  availability: string;
  createdAt: string;
  isOwner: boolean;
};

@Injectable()
export class EmployabilityService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getFeed(viewerId: string, search?: string) {
    await this.usersService.requireActiveUser(viewerId);

    const normalizedSearch = search?.trim();
    const jobQuery: Record<string, unknown> = {};

    if (normalizedSearch) {
      jobQuery.$or = [
        { title: { $regex: normalizedSearch, $options: 'i' } },
        { description: { $regex: normalizedSearch, $options: 'i' } },
        { skillsRequired: { $elemMatch: { $regex: normalizedSearch, $options: 'i' } } },
        { location: { $regex: normalizedSearch, $options: 'i' } },
      ];
    }

    const [jobs, talentProfiles, applications] = await Promise.all([
      this.jobsCollection().find(jobQuery).sort({ createdAt: -1 }).toArray(),
      this.talentProfilesCollection().find({}).sort({ updatedAt: -1 }).toArray(),
      this.applicationsCollection().find({}).toArray(),
    ]);

    const userIds = Array.from(
      new Set([
        ...jobs.map((job) => job.authorId),
        ...talentProfiles.map((profile) => profile.userId),
        ...applications.map((application) => application.applicantId),
      ]),
    );
    const users = await this.usersService.findManyByIds(userIds);
    const userMap = new Map(users.map((user) => [user.id, user]));

    const applicationsByJob = new Map<string, EmployabilityApplicationRecord[]>();
    applications.forEach((application) => {
      const items = applicationsByJob.get(application.jobId) ?? [];
      items.push(application);
      applicationsByJob.set(application.jobId, items);
    });

    return {
      jobs: jobs.flatMap((job) => {
        const author = userMap.get(job.authorId);
        if (!author) {
          return [];
        }

        const jobApplications = applicationsByJob.get(job.id) ?? [];

        return [
          {
            id: job.id,
            title: job.title,
            company: author.company,
            author: this.mapPublicUser(author),
            description: job.description,
            skillsRequired: job.skillsRequired,
            experienceRequired: job.experienceRequired,
            location: job.location,
            applicants: jobApplications.length,
            hasApplied: jobApplications.some((application) => application.applicantId === viewerId),
            createdAt: job.createdAt.toISOString(),
            isOwner: job.authorId === viewerId,
          } satisfies EmployabilityJobResponse,
        ];
      }),
      talentProfiles: talentProfiles.flatMap((profile) => {
        const user = userMap.get(profile.userId);
        if (!user) {
          return [];
        }

        return [
          {
            id: profile.id,
            user: this.mapPublicUser(user),
            headline: user.position || 'Profesional disponible',
            description: profile.description,
            skills: profile.skills,
            experience: profile.experience,
            certifications: profile.certifications,
            availability: profile.availability,
            createdAt: profile.createdAt.toISOString(),
            isOwner: profile.userId === viewerId,
          } satisfies EmployabilityTalentProfileResponse,
        ];
      }),
      stats: {
        jobs: jobs.length,
        talentProfiles: talentProfiles.length,
        applications: applications.length,
      },
    };
  }

  async createJob(
    authorId: string,
    data: {
      title: string;
      description: string;
      skillsRequired: string[];
      experienceRequired: string;
      location?: string;
    },
  ) {
    const author = await this.usersService.requireActiveUser(authorId);
    const now = new Date();
    const job: EmployabilityJobRecord = {
      id: crypto.randomUUID(),
      authorId,
      title: data.title.trim(),
      description: data.description.trim(),
      skillsRequired: this.normalizeList(data.skillsRequired),
      experienceRequired: data.experienceRequired.trim(),
      location: data.location?.trim() || author.location || 'Publicacion interna',
      createdAt: now,
      updatedAt: now,
    };

    if (!job.title || !job.description || !job.skillsRequired.length || !job.experienceRequired) {
      throw new ForbiddenException('Completa titulo, descripcion, skills y experiencia requerida.');
    }

    await this.jobsCollection().insertOne(job);
    await this.notifyAudience({
      actorId: author.id,
      type: 'NEW_JOB',
      title: `${author.fullName} publico una nueva vacante: ${job.title}`,
      body: `${author.company} · ${job.location}`,
      entityId: job.id,
    });

    return {
      job: {
        id: job.id,
        title: job.title,
        company: author.company,
        author: this.mapPublicUser(author),
        description: job.description,
        skillsRequired: job.skillsRequired,
        experienceRequired: job.experienceRequired,
        location: job.location,
        applicants: 0,
        hasApplied: false,
        createdAt: job.createdAt.toISOString(),
        isOwner: true,
      } satisfies EmployabilityJobResponse,
    };
  }

  async updateJob(
    jobId: string,
    authorId: string,
    data: {
      title: string;
      description: string;
      skillsRequired: string[];
      experienceRequired: string;
      location?: string;
    },
  ) {
    const author = await this.usersService.requireActiveUser(authorId);
    const existing = await this.jobsCollection().findOne({ id: jobId });

    if (!existing) {
      throw new NotFoundException('Vacante no encontrada.');
    }

    if (existing.authorId !== author.id) {
      throw new ForbiddenException('Solo puedes editar tus propias vacantes.');
    }

    const title = data.title.trim();
    const description = data.description.trim();
    const skillsRequired = this.normalizeList(data.skillsRequired);
    const experienceRequired = data.experienceRequired.trim();
    const location = data.location?.trim() || existing.location || author.location || 'Publicacion interna';

    if (!title || !description || !skillsRequired.length || !experienceRequired) {
      throw new ForbiddenException('Completa titulo, descripcion, skills y experiencia requerida.');
    }

    await this.jobsCollection().updateOne(
      { id: jobId },
      {
        $set: {
          title,
          description,
          skillsRequired,
          experienceRequired,
          location,
          updatedAt: new Date(),
        },
      },
    );

    const applicants = await this.applicationsCollection().countDocuments({ jobId });

    return {
      job: {
        id: existing.id,
        title,
        company: author.company,
        author: this.mapPublicUser(author),
        description,
        skillsRequired,
        experienceRequired,
        location,
        applicants,
        hasApplied: false,
        createdAt: existing.createdAt.toISOString(),
        isOwner: true,
      } satisfies EmployabilityJobResponse,
    };
  }

  async applyToJob(jobId: string, applicantId: string) {
    const applicant = await this.usersService.requireActiveUser(applicantId);
    const job = await this.jobsCollection().findOne({ id: jobId });

    if (!job) {
      throw new NotFoundException('Vacante no encontrada.');
    }

    if (job.authorId === applicantId) {
      throw new ForbiddenException('No puedes postular a una vacante creada por tu mismo usuario.');
    }

    const existing = await this.applicationsCollection().findOne({ jobId, applicantId });
    if (existing) {
      throw new ForbiddenException('Ya postulaste a esta vacante.');
    }

    const now = new Date();
    const application: EmployabilityApplicationRecord = {
      id: crypto.randomUUID(),
      jobId,
      applicantId,
      createdAt: now,
      updatedAt: now,
    };

    await this.applicationsCollection().insertOne(application);
    const jobAuthor = await this.usersService.findById(job.authorId);
    await this.notificationsService.create({
      icon: 'FileText',
      type: 'JOB_APPLICATION',
      title: `${applicant.fullName} postulo a tu vacante`,
      body: `${job.title} · ${applicant.company} · ${applicant.position}`,
      entityType: 'publication',
      entityId: job.id,
      fromUserId: applicant.id,
      role: jobAuthor?.role === UserRole.SUPPLIER ? UserRole.SUPPLIER : UserRole.BUYER,
      userId: job.authorId,
      url: `/empleabilidad?job=${job.id}`,
      time: 'Ahora',
    });

    return {
      success: true,
      applicationId: application.id,
    };
  }

  async upsertTalentProfile(
    userId: string,
    data: {
      description: string;
      skills: string[];
      experience: string;
      certifications?: string[];
      availability?: string;
    },
  ) {
    const user = await this.usersService.requireActiveUser(userId);
    const description = data.description.trim();
    const skills = this.normalizeList(data.skills);
    const experience = data.experience.trim();
    const certifications = this.normalizeList(data.certifications ?? []);

    if (!description || !skills.length || !experience) {
      throw new ForbiddenException('Completa descripcion, skills y experiencia para publicar tu perfil.');
    }

    const now = new Date();
    const existing = await this.talentProfilesCollection().findOne({ userId });

    if (existing) {
      await this.talentProfilesCollection().updateOne(
        { userId },
        {
          $set: {
            description,
            skills,
            experience,
            certifications,
            availability: data.availability?.trim() || existing.availability || 'Disponible para contacto',
            updatedAt: now,
          },
        },
      );

      return {
        talentProfile: {
          id: existing.id,
          user: this.mapPublicUser(user),
          headline: user.position || 'Profesional disponible',
          description,
          skills,
          experience,
          certifications,
          availability: data.availability?.trim() || existing.availability || 'Disponible para contacto',
          createdAt: existing.createdAt.toISOString(),
          isOwner: true,
        } satisfies EmployabilityTalentProfileResponse,
      };
    }

    const profile: EmployabilityTalentProfileRecord = {
      id: crypto.randomUUID(),
      userId,
      description,
      skills,
      experience,
      certifications,
      availability: data.availability?.trim() || 'Disponible para contacto',
      createdAt: now,
      updatedAt: now,
    };

    await this.talentProfilesCollection().insertOne(profile);

    return {
      talentProfile: {
        id: profile.id,
        user: this.mapPublicUser(user),
        headline: user.position || 'Profesional disponible',
        description: profile.description,
        skills: profile.skills,
        experience: profile.experience,
        certifications: profile.certifications,
        availability: profile.availability,
        createdAt: profile.createdAt.toISOString(),
        isOwner: true,
      } satisfies EmployabilityTalentProfileResponse,
    };
  }

  private normalizeList(items: string[]): string[] {
    return items.map((item) => item.trim()).filter(Boolean);
  }

  private mapPublicUser(user: User): PublicEmployabilityUser {
    return {
      id: user.id,
      fullName: user.fullName,
      company: user.company,
      position: user.position,
      role: user.role,
    };
  }

  private async notifyAudience(data: {
    actorId: string;
    type: 'NEW_JOB';
    title: string;
    body: string;
    entityId: string;
  }) {
    const userIds = await this.usersService.listActiveUserIdsByRoles(
      [UserRole.BUYER, UserRole.EXPERT, UserRole.SUPPLIER],
      data.actorId,
    );

    if (!userIds.length) {
      return;
    }

    const users = await this.usersService.findManyByIds(userIds);

    await Promise.all(
      users.map((user) =>
        this.notificationsService.create({
          icon: 'FileText',
          type: data.type,
          title: data.title,
          body: data.body,
          entityType: 'publication',
          entityId: data.entityId,
          fromUserId: data.actorId,
          role: user.role === UserRole.SUPPLIER ? UserRole.SUPPLIER : UserRole.BUYER,
          userId: user.id,
          url: '/empleabilidad',
          time: 'Ahora',
        }),
      ),
    );
  }

  private jobsCollection() {
    return this.databaseService.collection<EmployabilityJobRecord>('employabilityJobs');
  }

  private talentProfilesCollection() {
    return this.databaseService.collection<EmployabilityTalentProfileRecord>('employabilityTalentProfiles');
  }

  private applicationsCollection() {
    return this.databaseService.collection<EmployabilityApplicationRecord>('employabilityApplications');
  }
}
