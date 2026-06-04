import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

import { db, notes } from "@/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const { userId } = await auth();
  const { noteId } = await params;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Whitelist updateable fields
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.isPinned !== undefined) updateData.isPinned = body.isPinned;
    if (body.isTrash !== undefined) updateData.isTrash = body.isTrash;

    const [updatedNote] = await db
      .update(notes)
      .set(updateData)
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
      .returning();

    if (!updatedNote) {
      return new Response("Note not found or unauthorized", { status: 404 });
    }

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error("Error updating note:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const { userId } = await auth();
  const { noteId } = await params;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const [deletedNote] = await db
      .delete(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
      .returning();

    if (!deletedNote) {
      return new Response("Note not found or unauthorized", { status: 404 });
    }

    return NextResponse.json({ success: true, deletedNote });
  } catch (error) {
    console.error("Error deleting note:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
