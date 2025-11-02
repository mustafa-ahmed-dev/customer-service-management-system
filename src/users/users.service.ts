import { Injectable } from '@nestjs/common';
import { DBService } from '@/db/db.service';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class UsersService {
  constructor(private readonly dbService: DBService) {}

  async findAll() {
    const db = this.dbService.getDb();
    return await db.select().from(users);
  }

  async findOne(id: number) {
    const db = this.dbService.getDb();
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async create(data: typeof users.$inferInsert) {
    const db = this.dbService.getDb();
    const result = await db.insert(users).values(data).returning();
    return result[0];
  }

  async update(id: number, data: Partial<typeof users.$inferInsert>) {
    const db = this.dbService.getDb();
    const result = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async remove(id: number) {
    const db = this.dbService.getDb();
    await db.delete(users).where(eq(users.id, id));
  }
}
