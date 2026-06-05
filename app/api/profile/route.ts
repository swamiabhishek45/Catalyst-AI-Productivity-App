import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db, users } from "@/db";

export async function PATCH(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { name, imageUrl, email } = await request.json();

    // Check if user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    if (!user) {
      return new Response("User not found in database", { status: 404 });
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        name: name !== undefined ? name : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        email: email !== undefined ? email : undefined,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkUserId, userId))
      .returning();

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
