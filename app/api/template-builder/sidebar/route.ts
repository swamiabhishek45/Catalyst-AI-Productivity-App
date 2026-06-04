import { auth } from "@clerk/nextjs/server";
import { and, eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { aiTemplates } from "@/db/schema";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const sidebarApps = await db
      .select({
        id: aiTemplates.id,
        appName: aiTemplates.appName,
        icon: aiTemplates.icon,
        color: aiTemplates.color,
      })
      .from(aiTemplates)
      .where(and(eq(aiTemplates.userId, userId), eq(aiTemplates.inSidebar, true)))
      .orderBy(desc(aiTemplates.updatedAt));

    return NextResponse.json({ apps: sidebarApps });
  } catch (error) {
    console.error("Error fetching sidebar apps:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
