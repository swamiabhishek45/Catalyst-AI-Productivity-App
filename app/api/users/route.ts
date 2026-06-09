import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { db, users } from "@/db";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const allUsers = await db
      .select({
        clerkUserId: users.clerkUserId,
        name: users.name,
        email: users.email,
        imageUrl: users.imageUrl,
      })
      .from(users);

    // Map by Clerk User ID for quick lookup
    const userMap: Record<string, { name: string; imageUrl: string | null; email: string }> = {};
    for (const u of allUsers) {
      userMap[u.clerkUserId] = {
        name: u.name || u.email.split("@")[0],
        imageUrl: u.imageUrl,
        email: u.email,
      };
    }

    return NextResponse.json(userMap);
  } catch (error) {
    console.error("Error fetching user profiles:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
