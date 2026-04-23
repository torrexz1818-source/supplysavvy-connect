import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { UserRole } from '../users/domain/user-role.enum';

export type NotificationIcon =
  | 'Building2'
  | 'MessageCircle'
  | 'FileText'
  | 'Star';

export type NotificationType =
  | 'LIKE_PUBLICATION'
  | 'COMMENT_PUBLICATION'
  | 'NEW_MESSAGE'
  | 'NEW_CONVERSATION'
  | 'MESSAGE_REPLY'
  | 'NEW_BUYER'
  | 'NEW_SUPPLIER'
  | 'PROFILE_VIEW'
  | 'NEW_EDUCATIONAL_CONTENT'
  | 'REVIEW_RECEIVED'
  | 'MONTHLY_REPORT'
  | 'SYSTEM';

export type NotificationEntityType =
  | 'publication'
  | 'message'
  | 'user'
  | 'report'
  | 'content'
  | 'review';

type NotificationRole = UserRole.BUYER | UserRole.SUPPLIER;

export type NotificationRecord = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  entityType?: NotificationEntityType;
  entityId?: string;
  fromUserId?: string;
  icon: NotificationIcon;
  time: string;
  isRead: boolean;
  role: NotificationRole;
  url?: string;
  createdAt: string;
};

type PublicNotification = Omit<NotificationRecord, 'role'>;

type CreateNotificationData = {
  userId: string;
  type?: NotificationType;
  title: string;
  body?: string;
  description?: string;
  entityType?: NotificationEntityType;
  entityId?: string;
  fromUserId?: string;
  icon: NotificationIcon;
  role: NotificationRole;
  time?: string;
  url?: string;
};

type CreateNotificationsForUsersData = Omit<CreateNotificationData, 'userId'> & {
  userIds: string[];
};

type NotificationDocument = Omit<NotificationRecord, 'createdAt'> & {
  createdAt: Date;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async listByRole(role: NotificationRole, userId?: string): Promise<PublicNotification[]> {
    if (!userId) {
      return [];
    }

    const notifications = await this.notificationsCollection()
      .find({ role, userId })
      .sort({ createdAt: -1 })
      .toArray();

    return notifications.map((notification) => this.toPublicNotification(notification));
  }

  async listByUser(
    userId: string,
    filters?: { isRead?: boolean; type?: NotificationType; limit?: number; offset?: number },
  ): Promise<PublicNotification[]> {
    const query: Partial<NotificationDocument> & { userId: string } = { userId };

    if (typeof filters?.isRead === 'boolean') {
      query.isRead = filters.isRead;
    }

    if (filters?.type) {
      query.type = filters.type;
    }

    const offset = Math.max(0, filters?.offset ?? 0);
    const limit = Math.max(1, filters?.limit ?? 100);
    const base = await this.notificationsCollection()
      .find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    return base.map((notification) => this.toPublicNotification(notification));
  }

  async unreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.notificationsCollection().countDocuments({
      userId,
      isRead: false,
    });
    return { count };
  }

  async markAsRead(id: string, userId: string): Promise<{ success: true; id: string }> {
    const result = await this.notificationsCollection().updateOne(
      { id, userId },
      { $set: { isRead: true } },
    );

    if (!result.matchedCount) {
      throw new NotFoundException('Notificacion no encontrada.');
    }
    return { success: true, id };
  }

  async markAllAsRead(userId: string): Promise<{ success: true; updated: number }> {
    const result = await this.notificationsCollection().updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } },
    );
    return { success: true, updated: result.modifiedCount };
  }

  async remove(id: string, userId: string): Promise<{ success: true; id: string }> {
    const result = await this.notificationsCollection().deleteOne({ id, userId });

    if (!result.deletedCount) {
      throw new NotFoundException('Notificacion no encontrada.');
    }
    return { success: true, id };
  }

  async create(data: CreateNotificationData): Promise<NotificationRecord> {
    const createdAt = new Date();
    const notification: NotificationRecord = {
      id: crypto.randomUUID(),
      userId: data.userId,
      type: data.type ?? 'SYSTEM',
      title: data.title,
      body: data.body ?? data.description ?? '',
      entityType: data.entityType,
      entityId: data.entityId,
      fromUserId: data.fromUserId,
      icon: data.icon,
      time: data.time ?? 'Ahora',
      role: data.role,
      url: data.url,
      isRead: false,
      createdAt: createdAt.toISOString(),
    };

    await this.notificationsCollection().insertOne({
      ...notification,
      createdAt,
    });
    return notification;
  }

  async createForUsers(data: CreateNotificationsForUsersData): Promise<NotificationRecord[]> {
    const userIds = Array.from(new Set(data.userIds.filter(Boolean)));

    if (!userIds.length) {
      return [];
    }

    return Promise.all(userIds.map((userId) =>
      this.create({
        userId,
        type: data.type,
        title: data.title,
        body: data.body,
        description: data.description,
        entityType: data.entityType,
        entityId: data.entityId,
        fromUserId: data.fromUserId,
        icon: data.icon,
        role: data.role,
        time: data.time,
        url: data.url,
      }),
    ));
  }

  async exists(filters: { userId: string; type: NotificationType; entityId?: string }): Promise<boolean> {
    const notification = await this.notificationsCollection().findOne({
      userId: filters.userId,
      type: filters.type,
      ...(filters.entityId ? { entityId: filters.entityId } : {}),
    });

    return Boolean(notification);
  }

  private notificationsCollection() {
    return this.databaseService.collection<NotificationDocument>('notifications');
  }

  private toPublicNotification(notification: NotificationDocument): PublicNotification {
    const { role: _role, ...publicNotification } = notification;
    return {
      ...publicNotification,
      createdAt: notification.createdAt.toISOString(),
    };
  }
}
