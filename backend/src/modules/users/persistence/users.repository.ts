import { Injectable } from '@nestjs/common';
import { Collection, Filter, FindOptions, UpdateFilter, UpdateOptions } from 'mongodb';
import { DatabaseService } from '../../database/database.service';
import { User } from '../domain/user.model';

@Injectable()
export class UsersRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  collection(): Collection<User> {
    return this.databaseService.collection<User>('users');
  }

  async create(user: User): Promise<User> {
    await this.collection().insertOne(user);
    return user;
  }

  findByEmail(email: string): Promise<User | null> {
    return this.collection().findOne({
      email: email.trim().toLowerCase(),
    });
  }

  findById(id: string): Promise<User | null> {
    return this.collection().findOne({ id });
  }

  async findManyByIds(ids: string[]): Promise<User[]> {
    const normalizedIds = Array.from(new Set(ids.filter(Boolean)));

    if (!normalizedIds.length) {
      return [];
    }

    return this.collection()
      .find({ id: { $in: normalizedIds } })
      .toArray();
  }

  list(): Promise<User[]> {
    return this.collection().find().sort({ createdAt: -1 }).toArray();
  }

  findOne(filter: Filter<User>, options?: FindOptions): Promise<User | null> {
    return this.collection().findOne(filter, options);
  }

  find(filter: Filter<User>, options?: FindOptions) {
    return this.collection().find(filter, options);
  }

  updateOne(
    filter: Filter<User>,
    update: UpdateFilter<User> | Partial<User>,
    options?: UpdateOptions,
  ) {
    return this.collection().updateOne(filter, update as UpdateFilter<User>, options);
  }
}
