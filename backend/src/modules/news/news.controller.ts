import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Request } from 'express';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { extname, join } from 'path';
import { AdminGuard } from '../../common/auth/admin.guard';
import { AuthenticatedGuard } from '../../common/auth/authenticated.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { UploadsService } from '../uploads/uploads.service';
import { NewsService } from './news.service';

type CreateNewsBody = {
  title: string;
  body?: string;
};

type CreateCommentBody = {
  content: string;
  parentId?: string;
};

@Controller('news')
@UseGuards(AuthenticatedGuard)
export class NewsController {
  constructor(
    private readonly newsService: NewsService,
    private readonly jwtService: JwtService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Get()
  list(@Req() request: Request): Promise<unknown> {
    return this.newsService.listPosts(this.getViewerId(request));
  }

  @Post()
  @UseGuards(AuthenticatedGuard, AdminGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          const uploadDir = join(process.cwd(), 'uploads');
          if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
          }
          callback(null, uploadDir);
        },
        filename: (_req, file, callback) => {
          callback(
            null,
            `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname || '')}`,
          );
        },
      }),
    }),
  )
  async create(
    @Body() body: CreateNewsBody,
    @UploadedFile() image: { filename: string; path: string; originalname: string; mimetype: string } | undefined,
    @CurrentUser() user: { sub: string },
  ): Promise<unknown> {
    const imageUrl = image
      ? await this.uploadsService.saveFile({
          filePath: image.path,
          relativePath: image.filename,
          originalName: image.originalname,
          mimeType: image.mimetype,
        })
      : undefined;

    if (image) {
      rmSync(image.path, { force: true });
    }

    return this.newsService.createPost({
      title: body.title,
      body: body.body,
      imageUrl,
      authorId: user.sub,
    });
  }

  @Post(':id/like')
  toggleLike(@Param('id') id: string, @CurrentUser() user: { sub: string }): Promise<unknown> {
    return this.newsService.toggleLike(id, user.sub);
  }

  @Post(':id/comments')
  comment(
    @Param('id') id: string,
    @Body() body: CreateCommentBody,
    @CurrentUser() user: { sub: string },
  ): Promise<unknown> {
    return this.newsService.addComment(id, {
      content: body.content,
      parentId: body.parentId,
      authorId: user.sub,
    });
  }

  private getViewerId(request: Request): string | undefined {
    const header = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      return undefined;
    }

    try {
      const payload = this.jwtService.verify<{ sub?: string }>(header.slice(7).trim());
      return payload.sub;
    } catch {
      return undefined;
    }
  }
}
