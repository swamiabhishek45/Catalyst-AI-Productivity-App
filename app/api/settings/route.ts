import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db, userSettings } from "@/db";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));

    if (settings) {
      return NextResponse.json(settings);
    }

    // Create default settings if they don't exist
    const [newSettings] = await db
      .insert(userSettings)
      .values({
        userId,
        theme: "system",
        notificationsEnabled: true,
        defaultCalendarView: "month",
        defaultTaskPriority: "medium",
        autoSaveEnabled: true,
        aiModel: "gemini-2.5-flash",
        aiBehavior: "",
        aiTone: "cozy",
        aiFeatures: "refine,assistant,template",
        subscriptionPlan: "Free Tier",
        subscriptionStatus: "active",
      })
      .returning();

    return NextResponse.json(newSettings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Assign fields dynamically
    const fieldsToUpdate: Record<string, any> = {};
    const allowedFields = [
      "theme",
      "notificationsEnabled",
      "defaultCalendarView",
      "defaultTaskPriority",
      "autoSaveEnabled",
      "aiModel",
      "aiBehavior",
      "aiTone",
      "aiFeatures",
      "subscriptionPlan",
      "subscriptionStatus",
      "subscriptionRenewal"
    ];

    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        fieldsToUpdate[key] = body[key];
      }
    }
    
    fieldsToUpdate.updatedAt = new Date();

    const [updatedSettings] = await db
      .insert(userSettings)
      .values({
        userId,
        ...fieldsToUpdate,
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: fieldsToUpdate,
      })
      .returning();

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error("Error updating settings:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
