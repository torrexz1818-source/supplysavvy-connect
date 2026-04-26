import { Injectable, NotFoundException } from '@nestjs/common';
import { createReadStream } from 'fs';
import { basename } from 'path';
import { pipeline } from 'stream/promises';
import { GridFSBucket, GridFSFile } from 'mongodb';
import { DatabaseService } from '../database/database.service';

type SaveBufferInput = {
  buffer: Buffer;
  relativePath: string;
  originalName: string;
  mimeType?: string;
  size?: number;
};

type SaveFileInput = {
  filePath: string;
  relativePath: string;
  originalName?: string;
  mimeType?: string;
};

function normalizeUploadPath(value: string): string {
  return value.replace(/\\/g, '/').replace(/^\/+/, '');
}

export function getPublicUploadUrl(relativePath: string): string {
  const normalizedPath = normalizeUploadPath(relativePath);
  const configuredBaseUrl =
    process.env.PUBLIC_API_URL?.trim() ||
    process.env.API_PUBLIC_URL?.trim() ||
    process.env.BACKEND_PUBLIC_URL?.trim() ||
    (process.env.NODE_ENV === 'production' ? 'https://api.supplynexu.com' : '');
  const baseUrl = configuredBaseUrl.replace(/\/$/, '');

  return baseUrl ? `${baseUrl}/uploads/${normalizedPath}` : `/api/uploads/${normalizedPath}`;
}

@Injectable()
export class UploadsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async saveBuffer(input: SaveBufferInput): Promise<string> {
    const relativePath = normalizeUploadPath(input.relativePath);
    const bucket = this.getBucket();

    await this.deleteExisting(relativePath);

    await new Promise<void>((resolve, reject) => {
      const upload = bucket.openUploadStream(relativePath, {
        metadata: {
          originalName: input.originalName,
          mimeType: input.mimeType,
          size: input.size,
        },
      });

      upload.once('finish', () => resolve());
      upload.once('error', reject);
      upload.end(input.buffer);
    });

    return getPublicUploadUrl(relativePath);
  }

  async saveFile(input: SaveFileInput): Promise<string> {
    const relativePath = normalizeUploadPath(input.relativePath);
    const bucket = this.getBucket();

    await this.deleteExisting(relativePath);

    const upload = bucket.openUploadStream(relativePath, {
      metadata: {
        originalName: input.originalName ?? basename(input.filePath),
        mimeType: input.mimeType,
      },
    });

    await pipeline(createReadStream(input.filePath), upload);

    return getPublicUploadUrl(relativePath);
  }

  async findFile(relativePath: string): Promise<GridFSFile> {
    const normalizedPath = normalizeUploadPath(relativePath);
    const file = await this.getBucket().find({ filename: normalizedPath }).next();

    if (!file) {
      throw new NotFoundException('Archivo no encontrado');
    }

    return file;
  }

  openDownloadStream(file: GridFSFile, range?: { start: number; endExclusive: number }) {
    return this.getBucket().openDownloadStream(
      file._id,
      range ? { start: range.start, end: range.endExclusive } : undefined,
    );
  }

  private getBucket() {
    return new GridFSBucket(this.databaseService.getDb(), {
      bucketName: 'uploads',
    });
  }

  private async deleteExisting(relativePath: string) {
    const files = await this.getBucket().find({ filename: relativePath }).toArray();
    await Promise.all(files.map((file) => this.getBucket().delete(file._id)));
  }
}
