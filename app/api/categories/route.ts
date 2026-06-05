import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db, categories } from "@/db";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const userCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId));

    if (userCategories.length > 0) {
      return NextResponse.json(userCategories);
    }

    // Seed default categories for this user so they don't start with empty lists
    const defaultCats = [
      { id: `cat-focus-${crypto.randomUUID()}`, userId, name: "Focus", type: "calendar", color: "#38bdf8", icon: "Target" },
      { id: `cat-home-${crypto.randomUUID()}`, userId, name: "Home", type: "calendar", color: "#34d399", icon: "Home" },
      { id: `cat-work-${crypto.randomUUID()}`, userId, name: "Work", type: "calendar", color: "#a78bfa", icon: "Briefcase" },
      { id: `cat-wellness-${crypto.randomUUID()}`, userId, name: "Wellness", type: "calendar", color: "#f43f5e", icon: "Heart" },
      { id: `cat-finance-${crypto.randomUUID()}`, userId, name: "Finance", type: "calendar", color: "#fbbf24", icon: "DollarSign" },
      
      { id: `cat-todo-${crypto.randomUUID()}`, userId, name: "To-Do", type: "kanban", color: "#f97316", icon: "CheckSquare" },
      { id: `cat-design-${crypto.randomUUID()}`, userId, name: "Design", type: "kanban", color: "#ec4899", icon: "Sparkles" },
      
      { id: `cat-journal-${crypto.randomUUID()}`, userId, name: "Journal", type: "notes", color: "#8b5cf6", icon: "BookOpen" },
      { id: `cat-ideas-${crypto.randomUUID()}`, userId, name: "Ideas", type: "notes", color: "#eab308", icon: "Lightbulb" },
      
      { id: `cat-urgent-${crypto.randomUUID()}`, userId, name: "Urgent", type: "reminders", color: "#ef4444", icon: "AlertCircle" },
      { id: `cat-followup-${crypto.randomUUID()}`, userId, name: "Follow-up", type: "reminders", color: "#06b6d4", icon: "Phone" },
    ];

    await db.insert(categories).values(defaultCats);

    return NextResponse.json(defaultCats);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, type, color, icon } = body;

    if (!name || !type || !color) {
      return new Response("Missing required fields", { status: 400 });
    }

    const newCat = {
      id: `cat-${crypto.randomUUID()}`,
      userId,
      name,
      type,
      color,
      icon: icon || "Tag",
    };

    const [created] = await db.insert(categories).values(newCat).returning();

    return NextResponse.json(created);
  } catch (error) {
    console.error("Error creating category:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
