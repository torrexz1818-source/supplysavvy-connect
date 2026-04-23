import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthenticatedGuard } from '../../common/auth/authenticated.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { MessagesService } from './messages.service';

type CreateMessageBody = {
  supplierId?: string;
  buyerId?: string;
  publicationId?: string;
  postId?: string;
  message?: string;
  attachments?: Array<{
    id?: string;
    kind?: 'image' | 'file' | 'location' | 'publication';
    name?: string;
    url?: string;
    mimeType?: string;
    size?: number;
    latitude?: number;
    longitude?: number;
    label?: string;
    publicationId?: string;
    description?: string;
    thumbnailUrl?: string;
  }>;
};

type CreateConversationBody = {
  toUserId?: string;
  publicationId?: string | null;
};

@Controller('messages')
@UseGuards(AuthenticatedGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('inbox')
  getInbox(@CurrentUser() user: { sub: string }) {
    return this.messagesService.getSupplierInbox(user.sub);
  }

  @Get('conversations')
  getConversationByPair(
    @CurrentUser() user: { sub: string },
    @Query('buyerId') buyerId: string,
    @Query('supplierId') supplierId: string,
    @Query('publicationId') publicationId?: string,
  ) {
    return this.messagesService.getConversationByParticipants({
      viewerId: user.sub,
      buyerId,
      supplierId,
      publicationId,
    });
  }

  @Get('conversations/list')
  listConversations(@CurrentUser() user: { sub: string }) {
    return this.messagesService.listConversations(user.sub);
  }

  @Post('conversations')
  createConversation(
    @CurrentUser() user: { sub: string },
    @Body() body: CreateConversationBody,
  ) {
    return this.messagesService.createConversation({
      viewerId: user.sub,
      toUserId: body.toUserId ?? '',
      publicationId: body.publicationId ?? undefined,
    });
  }

  @Get('conversations/:id/messages')
  getConversationMessages(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
  ) {
    return this.messagesService.listConversationMessages(id, user.sub);
  }

  @Post('conversations/:id/messages')
  postConversationMessage(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() body: { message?: string; attachments?: CreateMessageBody['attachments'] },
  ) {
    return this.messagesService.sendConversationMessage({
      conversationId: id,
      viewerId: user.sub,
      message: body.message ?? '',
      attachments: (body.attachments ?? []).map((attachment) => ({
        id: attachment.id ?? crypto.randomUUID(),
        kind: attachment.kind ?? 'file',
        name: attachment.name ?? 'Adjunto',
        url: attachment.url,
        mimeType: attachment.mimeType,
        size: attachment.size,
        latitude: attachment.latitude,
        longitude: attachment.longitude,
        label: attachment.label,
        publicationId: attachment.publicationId,
        description: attachment.description,
        thumbnailUrl: attachment.thumbnailUrl,
      })),
    });
  }

  @Post()
  create(
    @Body() body: CreateMessageBody,
    @CurrentUser() user: { sub: string },
  ): Promise<unknown> {
    return this.messagesService.create({
      senderId: user.sub,
      supplierId: body.supplierId ?? '',
      buyerId: body.buyerId,
      publicationId: body.publicationId,
      postId: body.postId,
      message: body.message ?? '',
      attachments: (body.attachments ?? []).map((attachment) => ({
        id: attachment.id ?? crypto.randomUUID(),
        kind: attachment.kind ?? 'file',
        name: attachment.name ?? 'Adjunto',
        url: attachment.url,
        mimeType: attachment.mimeType,
        size: attachment.size,
        latitude: attachment.latitude,
        longitude: attachment.longitude,
        label: attachment.label,
        publicationId: attachment.publicationId,
        description: attachment.description,
        thumbnailUrl: attachment.thumbnailUrl,
      })),
    });
  }
}
