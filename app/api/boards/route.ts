import { auth, currentUser } from "@clerk/nextjs/server";
import { eq, or, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db, boards, boardShares } from "@/db";

export async function GET() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userEmail = user.primaryEmailAddress?.emailAddress;
  if (!userEmail) {
    return new Response("Missing email", { status: 400 });
  }

  try {
    // Get boards owned by user or shared with user
    const results = await db
      .select({
        id: boards.id,
        name: boards.name,
        color: boards.color,
        ownerId: boards.ownerId,
        createdAt: boards.createdAt,
      })
      .from(boards)
      .leftJoin(boardShares, eq(boards.id, boardShares.boardId))
      .where(
        or(
          eq(boards.ownerId, userId),
          eq(boardShares.userEmail, userEmail)
        )
      )
      .orderBy(desc(boards.createdAt));

    // Deduplicate in JS in case left join created duplicates
    const uniqueBoardsMap = new Map<string, typeof results[number]>();
    for (const b of results) {
      uniqueBoardsMap.set(b.id, b);
    }
    let userBoards = Array.from(uniqueBoardsMap.values());

    // Seeding default boards if the user has absolutely no boards
    if (userBoards.length === 0) {
      const defaultBoardsData = [
        {
          id: "board-1",
          name: "🚀 Product Launch",
          color: "bg-sky-500",
          ownerId: userId,
        },
        {
          id: "board-2",
          name: "🎨 Design System",
          color: "bg-violet-500",
          ownerId: userId,
        },
      ];

      const inserted = [];
      for (const boardData of defaultBoardsData) {
        try {
          const [newB] = await db
            .insert(boards)
            .values(boardData)
            .onConflictDoNothing()
            .returning();
          if (newB) {
            inserted.push(newB);
          }
        } catch (err) {
          console.error("Error seeding default board", err);
        }
      }

      if (inserted.length > 0) {
        userBoards = inserted;
      } else {
        // Fetch again in case conflict occurred but they exist
        const refetched = await db
          .select({
            id: boards.id,
            name: boards.name,
            color: boards.color,
            ownerId: boards.ownerId,
            createdAt: boards.createdAt,
          })
          .from(boards)
          .where(eq(boards.ownerId, userId));
        userBoards = refetched;
      }
    }

    return NextResponse.json(userBoards);
  } catch (error) {
    console.error("Error fetching boards:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { name, color } = await request.json();

    if (!name || !name.trim()) {
      return new Response("Board name is required", { status: 400 });
    }

    const newBoardId = `board-${crypto.randomUUID()}`;
    const [newBoard] = await db
      .insert(boards)
      .values({
        id: newBoardId,
        name: name.trim(),
        color: color || "bg-sky-500",
        ownerId: userId,
      })
      .returning();

    return NextResponse.json(newBoard);
  } catch (error) {
    console.error("Error creating board:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
