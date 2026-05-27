import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { syncCurrentUser } from "@/lib/users";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: "/sync-user" });
  }

  await syncCurrentUser();

  return NextResponse.redirect(new URL("/", request.url));
}
