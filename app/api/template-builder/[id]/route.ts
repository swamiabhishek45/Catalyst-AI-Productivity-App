import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { aiTemplates } from "@/db/schema";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  const { id } = await params;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const [template] = await db
      .select()
      .from(aiTemplates)
      .where(and(eq(aiTemplates.id, id), eq(aiTemplates.userId, userId)));

    if (!template) {
      return new Response("Template not found or unauthorized", { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error fetching template by ID:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  const { id } = await params;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (body.appName !== undefined) updateData.appName = body.appName;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.layout !== undefined) updateData.layout = body.layout;
    if (body.config !== undefined) {
      updateData.config = typeof body.config === "string" ? body.config : JSON.stringify(body.config);
    }
    
    if (body.inSidebar !== undefined) {
      // Check the sidebar limit before turning inSidebar to true
      if (body.inSidebar === true) {
        const sidebarCount = await db
          .select({ count: aiTemplates.id })
          .from(aiTemplates)
          .where(and(eq(aiTemplates.userId, userId), eq(aiTemplates.inSidebar, true)));

        // Exclude the current template from the count if it's already in the sidebar
        const currentInSidebar = sidebarCount.filter(item => item.count !== id);
        
        if (currentInSidebar.length >= 3) {
          return NextResponse.json(
            { error: "Sidebar limit reached. You can only pin up to 3 apps." },
            { status: 400 }
          );
        }
      }
      updateData.inSidebar = body.inSidebar;
    }

    const [updatedTemplate] = await db
      .update(aiTemplates)
      .set(updateData)
      .where(and(eq(aiTemplates.id, id), eq(aiTemplates.userId, userId)))
      .returning();

    if (!updatedTemplate) {
      return new Response("Template not found or unauthorized", { status: 404 });
    }

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error("Error updating template:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  const { id } = await params;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const [deletedTemplate] = await db
      .delete(aiTemplates)
      .where(and(eq(aiTemplates.id, id), eq(aiTemplates.userId, userId)))
      .returning();

    if (!deletedTemplate) {
      return new Response("Template not found or unauthorized", { status: 404 });
    }

    return NextResponse.json({ success: true, deletedTemplate });
  } catch (error) {
    console.error("Error deleting template:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
