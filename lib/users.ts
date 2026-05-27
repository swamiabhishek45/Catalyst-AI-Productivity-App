import { currentUser } from "@clerk/nextjs/server";
import { sql } from "drizzle-orm";

import { db, users } from "@/db";

export async function syncCurrentUser() {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const email = user.primaryEmailAddress?.emailAddress;

  if (!email) {
    return null;
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || null;
  const imageUrl = user.imageUrl || null;

  const [syncedUser] = await db
    .insert(users)
    .values({
      clerkUserId: user.id,
      email,
      name,
      imageUrl,
    })
    .onConflictDoUpdate({
      target: users.clerkUserId,
      set: {
        email,
        name,
        imageUrl,
        updatedAt: sql`now()`,
      },
    })
    .returning();

  return syncedUser;
}
