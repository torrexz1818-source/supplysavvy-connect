import {
  BadRequestException,
  Controller,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import type { Request } from 'express';
import { AuthenticatedGuard } from '../../common/auth/authenticated.guard';

const uploadMaxFileSize =
  Number.parseInt(process.env.UPLOAD_MAX_FILE_SIZE_BYTES?.trim() || '', 10) || 50 * 1024 * 1024;

type UploadPurpose = 'general' | 'messages' | 'posts' | 'resources';

@Controller('uploads')
@UseGuards(AuthenticatedGuard)
export class UploadsController {
  @Post('file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (request: Request, _file, callback) => {
          const purpose = UploadsController.normalizePurpose(
            typeof request.query.purpose === 'string' ? request.query.purpose : undefined,
          );
          const uploadDir = join(process.cwd(), 'uploads', purpose);

          UploadsController.ensureDir(uploadDir);
          callback(null, uploadDir);
        },
        filename: (_request, file, callback) => {
          const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname || '')}`;
          callback(null, uniqueName);
        },
      }),
      limits: {
        fileSize: uploadMaxFileSize,
      },
    }),
  )
  uploadFile(
    @UploadedFile()
    file?: {
      originalname: string;
      filename: string;
      mimetype: string;
      size: number;
    },
    @Query('purpose') purpose?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Selecciona un archivo para subir');
    }

    const normalizedPurpose = UploadsController.normalizePurpose(purpose);

    return {
      file: {
        url: this.fileToPublicUrl(`${normalizedPurpose}/${file.filename}`),
        name: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
    };
  }

  private fileToPublicUrl(relativePath: string): string {
    return `/api/uploads/${relativePath.replace(/\\/g, '/')}`;
  }

  private static normalizePurpose(value?: string): UploadPurpose {
    if (value === 'messages' || value === 'posts' || value === 'resources') {
      return value;
    }

    return 'general';
  }

  private static ensureDir(path: string) {
    if (!existsSync(path)) {
      mkdirSync(path, { recursive: true });
    }
  }
}
