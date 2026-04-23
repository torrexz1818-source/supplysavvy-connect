import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthenticatedGuard } from '../../common/auth/authenticated.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { MessagesService } from './messages.service';

type MessageAttachmentBody = {
  id?: string;
  kind?: 'image' | 'file' | 'location' | 'publication' | 'profile';
  name?: string;
  url?: string;
  mimeType?: string;
  size?: number;
  latitude?: number;
  longitude?: number;
  label?: string;
  publicationId?: string;
  profileId?: string;
  description?: string;
  thumbnailUrl?: string;
};

@Controller('conversations')
@UseGuards(AuthenticatedGuard)
export class ConversationsController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  getConversationByPair(
    @CurrentUser() user: { sub: string },
    @Query('buyerId') buyerId: string,
    @Query('supplierId') supplierId: string,
    @Query('publicationId') publicationId?: string,
  ) {
    if (buyerId && supplierId) {
      return this.messagesService.getConversationByParticipants({
        viewerId: user.sub,
        buyerId,
        supplierId,
        publicationId,
      });
    }

    return this.messagesService.listConversations(user.sub);
  }

  @Post()
  createConversation(
    @CurrentUser() user: { sub: string },
    @Body() body: { toUserId?: string; publicationId?: string | null },
  ) {
    return this.messagesService.createConversation({
      viewerId: user.sub,
      toUserId: body.toUserId ?? '',
      publicationId: body.publicationId ?? undefined,
    });
  }

  @Get(':id/messages')
  getConversationMessages(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
  ) {
    return this.messagesService.listConversationMessages(id, user.sub);
  }

  @Post(':id/messages')
  postConversationMessage(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() body: { message?: string; attachments?: MessageAttachmentBody[] },
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
        profileId: attachment.profileId,
        description: attachment.description,
        thumbnailUrl: attachment.thumbnailUrl,
      })),
    });
  }
}
