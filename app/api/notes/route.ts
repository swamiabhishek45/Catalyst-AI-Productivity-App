import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db, notes } from "@/db";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const userNotes = await db
      .select()
      .from(notes)
      .where(eq(notes.userId, userId))
      .orderBy(desc(notes.updatedAt));

    return NextResponse.json(userNotes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    let body = { title: "Untitled Note", color: "gray", icon: "FileText", content: "" };
    try {
      const parsed = await request.json();
      body = { ...body, ...parsed };
    } catch {
      // Body might be empty, use defaults
    }

    const noteId = `note-${crypto.randomUUID()}`;
    const [newNote] = await db
      .insert(notes)
      .values({
        id: noteId,
        title: body.title,
        color: body.color,
        icon: body.icon,
        content: body.content,
        userId: userId,
      })
      .returning();

    return NextResponse.json(newNote);
  } catch (error) {
    console.error("Error creating note:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
