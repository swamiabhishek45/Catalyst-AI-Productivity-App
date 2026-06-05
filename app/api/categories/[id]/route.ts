import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db, categories } from "@/db";

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
    const { name, color, icon } = body;

    // Check ownership
    const cat = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .limit(1);

    if (cat.length === 0) {
      return new Response("Forbidden or Category not found", { status: 403 });
    }

    const [updatedCat] = await db
      .update(categories)
      .set({
        name: name !== undefined ? name : undefined,
        color: color !== undefined ? color : undefined,
        icon: icon !== undefined ? icon : undefined,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))
      .returning();

    return NextResponse.json(updatedCat);
  } catch (error) {
    console.error("Error updating category:", error);
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
    // Check ownership
    const cat = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .limit(1);

    if (cat.length === 0) {
      return new Response("Forbidden or Category not found", { status: 403 });
    }

    const [deletedCat] = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();

    return NextResponse.json(deletedCat);
  } catch (error) {
    console.error("Error deleting category:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
