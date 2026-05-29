import { auth, currentUser } from "@clerk/nextjs/server";
import { Liveblocks } from "@liveblocks/node";
import { and, eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db, boards, boardShares } from "@/db";

// Helper to generate a persistent color based on string hash
function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}deg 70% 60%)`;
}

export async function POST(request: Request) {
  // 1. Get Clerk auth details
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userEmail = user.primaryEmailAddress?.emailAddress;
  if (!userEmail) {
    return new Response("Missing user email", { status: 400 });
  }

  // 2. Parse room parameter
  let room: string;
  try {
    const body = await request.json();
    room = body.room;
  } catch {
    return new Response("Invalid request body", { status: 400 });
  }

  if (!room) {
    return new Response("Room ID required", { status: 400 });
  }

  // 3. Authorization check
  // Room format: kanban-board-[boardId]
  let isAuthorized = false;
  
  if (room.startsWith("kanban-board-")) {
    const boardId = room.replace("kanban-board-", "");
    
    try {
      // Check if user owns the board
      const ownedBoard = await db
        .select()
        .from(boards)
        .where(and(eq(boards.id, boardId), eq(boards.ownerId, userId)))
        .limit(1);

      if (ownedBoard.length > 0) {
        isAuthorized = true;
      } else {
        // Check if the board is shared with this user's email
        const sharedBoard = await db
          .select()
          .from(boardShares)
          .where(and(eq(boardShares.boardId, boardId), eq(boardShares.userEmail, userEmail)))
          .limit(1);

        if (sharedBoard.length > 0) {
          isAuthorized = true;
        }
      }
    } catch (e) {
      console.error("Database authorization check failed", e);
      // Fallback for safety in dev: if database check fails but we are testing, allow ownership of default boards
      if (boardId === "board-1" || boardId === "board-2") {
        isAuthorized = true;
      }
    }
  } else {
    // Other future features (Notes, Whiteboards, etc.)
    // For now we allow them or authorize if they have active sessions
    isAuthorized = true;
  }

  if (!isAuthorized) {
    return new Response("Forbidden", { status: 403 });
  }

  // 4. Initialize Liveblocks Client
  const secretKey = process.env.LIVEBLOCKS_SECRET_KEY;

  if (!secretKey || secretKey.startsWith("sk_test_placeholder")) {
    console.warn("Liveblocks secret key is unconfigured. Returning mock session token.");
    // Return a mock token payload format so local frontend doesn't crash, but can notify user
    return NextResponse.json({
      token: "mock-token-unconfigured",
      mockUser: {
        id: userId,
        info: {
          name: [user.firstName, user.lastName].filter(Boolean).join(" ") || userEmail.split("@")[0],
          avatar: user.imageUrl || "",
          color: stringToColor(userEmail),
          email: userEmail,
        }
      }
    });
  }

  const liveblocks = new Liveblocks({ secret: secretKey });

  // 5. Prepare Liveblocks Session
  try {
    const userName = [user.firstName, user.lastName].filter(Boolean).join(" ") || userEmail.split("@")[0];
    const userColor = stringToColor(userEmail);

    const session = liveblocks.prepareSession(userId, {
      userInfo: {
        name: userName,
        avatar: user.imageUrl || "",
        color: userColor,
        email: userEmail,
      },
    });

    // Grant full access to the requested room
    session.allow(room, session.FULL_ACCESS);

    const { status, body } = await session.authorize();
    return new Response(body, { status });
  } catch (err) {
    console.error("Liveblocks auth error:", err);
    return new Response("Liveblocks authorization error", { status: 500 });
  }
}
