import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db, boards, boardShares, users } from "@/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { userId } = await auth();
  const { boardId } = await params;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Check if the user has access to see shares (either owner or collaborator)
    const board = await db
      .select()
      .from(boards)
      .where(eq(boards.id, boardId))
      .limit(1);

    if (board.length === 0) {
      return new Response("Board not found", { status: 404 });
    }

    const isOwner = board[0].ownerId === userId;
    
    // Check collaborators
    const shares = await db
      .select()
      .from(boardShares)
      .where(eq(boardShares.boardId, boardId));

    // Get current user email to verify collaborator access
    const currentUserProfile = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    const currentUserEmail = currentUserProfile[0]?.email;
    const isCollaborator = shares.some(s => s.userEmail.toLowerCase() === currentUserEmail?.toLowerCase());

    if (!isOwner && !isCollaborator) {
      return new Response("Forbidden", { status: 403 });
    }

    // Resolve owner info
    const ownerProfile = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, board[0].ownerId))
      .limit(1);

    const collaborators = [];

    // Add owner
    collaborators.push({
      email: ownerProfile[0]?.email || "owner@catalyst.com",
      name: ownerProfile[0]?.name || "Board Owner",
      imageUrl: ownerProfile[0]?.imageUrl || "",
      isOwner: true,
    });

    // Resolve details for each invited collaborator
    for (const share of shares) {
      const userProfile = await db
        .select()
        .from(users)
        .where(eq(users.email, share.userEmail))
        .limit(1);

      collaborators.push({
        email: share.userEmail,
        name: userProfile[0]?.name || share.userEmail.split("@")[0],
        imageUrl: userProfile[0]?.imageUrl || "",
        isOwner: false,
      });
    }

    return NextResponse.json(collaborators);
  } catch (error) {
    console.error("Error fetching board shares:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { userId } = await auth();
  const { boardId } = await params;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { email } = await request.json();

    if (!email || !email.trim()) {
      return new Response("Email is required", { status: 400 });
    }

    const inviteEmail = email.trim().toLowerCase();

    // Verify current user is the owner (only owner can invite others)
    const board = await db
      .select()
      .from(boards)
      .where(and(eq(boards.id, boardId), eq(boards.ownerId, userId)))
      .limit(1);

    if (board.length === 0) {
      return new Response("Only the board owner can invite collaborators", { status: 403 });
    }

    // Owner cannot invite themselves
    const ownerProfile = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    if (ownerProfile[0]?.email?.toLowerCase() === inviteEmail) {
      return new Response("You cannot invite yourself as you are already the owner", { status: 400 });
    }

    // Check if already shared
    const existingShare = await db
      .select()
      .from(boardShares)
      .where(and(eq(boardShares.boardId, boardId), eq(boardShares.userEmail, inviteEmail)))
      .limit(1);

    if (existingShare.length > 0) {
      return new Response("This board is already shared with this user", { status: 400 });
    }

    // Create share record
    const [newShare] = await db
      .insert(boardShares)
      .values({
        boardId,
        userEmail: inviteEmail,
      })
      .returning();

    // Resolve invited user details for the response
    const invitedUser = await db
      .select()
      .from(users)
      .where(eq(users.email, inviteEmail))
      .limit(1);

    return NextResponse.json({
      email: inviteEmail,
      name: invitedUser[0]?.name || inviteEmail.split("@")[0],
      imageUrl: invitedUser[0]?.imageUrl || "",
      isOwner: false,
    });
  } catch (error) {
    console.error("Error creating board share:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
