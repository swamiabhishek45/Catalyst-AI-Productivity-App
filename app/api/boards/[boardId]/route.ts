import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db, boards, boardShares } from "@/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { userId } = await auth();
  const { boardId } = await params;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { name, color } = await request.json();

    if (!name || !name.trim()) {
      return new Response("Board name is required", { status: 400 });
    }

    // Check ownership
    const board = await db
      .select()
      .from(boards)
      .where(and(eq(boards.id, boardId), eq(boards.ownerId, userId)))
      .limit(1);

    if (board.length === 0) {
      return new Response("Forbidden or Board not found", { status: 403 });
    }

    const [updatedBoard] = await db
      .update(boards)
      .set({
        name: name.trim(),
        color: color,
      })
      .where(eq(boards.id, boardId))
      .returning();

    return NextResponse.json(updatedBoard);
  } catch (error) {
    console.error("Error updating board:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { userId } = await auth();
  const { boardId } = await params;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Check ownership
    const board = await db
      .select()
      .from(boards)
      .where(and(eq(boards.id, boardId), eq(boards.ownerId, userId)))
      .limit(1);

    if (board.length === 0) {
      return new Response("Forbidden or Board not found", { status: 403 });
    }

    // Delete shares first
    await db.delete(boardShares).where(eq(boardShares.boardId, boardId));

    // Delete board
    const [deletedBoard] = await db
      .delete(boards)
      .where(eq(boards.id, boardId))
      .returning();

    return NextResponse.json(deletedBoard);
  } catch (error) {
    console.error("Error deleting board:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
