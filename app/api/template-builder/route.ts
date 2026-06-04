import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { aiTemplates } from "@/db/schema";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const userTemplates = await db
      .select()
      .from(aiTemplates)
      .where(eq(aiTemplates.userId, userId))
      .orderBy(desc(aiTemplates.updatedAt));

    return NextResponse.json(userTemplates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, appName, description, icon, color, layout, config, inSidebar } = body;

    if (!appName) {
      return new Response("App Name is required", { status: 400 });
    }

    const templateId = id || `app-${crypto.randomUUID()}`;

    const [savedTemplate] = await db
      .insert(aiTemplates)
      .values({
        id: templateId,
        userId,
        appName,
        description: description || "",
        icon: icon || "Flame",
        color: color || "#F97316",
        layout: layout || "single-page",
        config: typeof config === "string" ? config : JSON.stringify(config),
        inSidebar: !!inSidebar,
      })
      .onConflictDoUpdate({
        target: aiTemplates.id,
        set: {
          appName,
          description: description || "",
          icon: icon || "Flame",
          color: color || "#F97316",
          layout: layout || "single-page",
          config: typeof config === "string" ? config : JSON.stringify(config),
          inSidebar: !!inSidebar,
          updatedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json(savedTemplate);
  } catch (error) {
    console.error("Error saving template:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
