import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db, boards, notes } from "@/db";

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { messages, currentTime } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "sk_test_placeholder" || apiKey.includes("placeholder")) {
      console.warn("GEMINI_API_KEY is not configured. Returning mock response.");
      return NextResponse.json(getMockChatResponse(messages, currentTime));
    }

    // 1. Fetch user context from database
    const userBoards = await db
      .select()
      .from(boards)
      .where(eq(boards.ownerId, userId))
      .orderBy(desc(boards.createdAt));

    const userNotes = await db
      .select()
      .from(notes)
      .where(eq(notes.userId, userId))
      .orderBy(desc(notes.updatedAt));

    // 2. Prepare System Prompt
    const systemPrompt = `You are "Antigravity", the friendly, cozy, and highly capable AI assistant built into Catalyst, a productivity workspace that combines text editing (like Notion) with spatial thinking (like Miro/whiteboards) and calendar/kanban planning.

You act as the central command center for the user's workspace.
Current User Clerk ID: ${userId}
Current Date/Time: ${currentTime || new Date().toISOString()}

Here is the context of the user's workspace:
- Boards (Kanban/Whiteboards): ${JSON.stringify(
      userBoards.map((b) => ({ id: b.id, name: b.name, color: b.color }))
    )}
- Notes: ${JSON.stringify(
      userNotes.map((n) => ({
        id: n.id,
        title: n.title,
        color: n.color,
        icon: n.icon,
        isPinned: n.isPinned,
        wordCount: n.content ? n.content.split(/\s+/).length : 0,
      }))
    )}

Notes content snippet (first 600 chars each for referencing or summarizing):
${JSON.stringify(
  userNotes.map((n) => ({
    id: n.id,
    title: n.title,
    content: n.content ? n.content.substring(0, 600) : "",
  }))
)}

CRITICAL INSTRUCTION FOR ACTIONS:
If the user tells you to perform a task, you can emit an action that the frontend will execute.
But if the request is ambiguous, missing required fields, or unclear, DO NOT emit the action. Instead, ask follow-up questions in the message!
- For scheduling on the calendar: We need a title, date (YYYY-MM-DD), time (HH:MM format), and category. If the user just says "schedule a meeting", ask for the date/time and category (Focus, Home, Work, Wellness, Finance) before proposing the action.
- For creating a note: We need a title and content. If missing, ask the user.
- For updating/refining a note: You must use the "UPDATE_NOTE" action. Find the correct noteId from the context list, refine its contents as requested (e.g. summarize, expand, simplify, grammar check), and set the payload's "content" to the fully refined text.
- For adding a task to Kanban: We need a boardId (refer to the list of user boards) and column name (Todo, In Progress, Done, or other). If board or column is ambiguous, ask the user.
- For updating settings: We support changing the theme.
- For creating a whiteboard diagram: We need a board name, diagram type (flowchart, mindmap, architecture, journey, process), and prompt.

OUTPUT FORMAT:
You MUST respond ONLY with a raw JSON object matching the schema below. Do NOT use markdown code blocks (no \`\`\`json or similar). Just return raw JSON.

{
  "message": "Your helpful response in clean markdown format. Keep it warm, encouraging, and clear. If you are asking clarifying questions, describe them here.",
  "action": null | {
    "type": "CREATE_BOARD" | "ADD_KANBAN_TASK" | "ADD_CALENDAR_TASK" | "CREATE_NOTE" | "UPDATE_NOTE" | "CREATE_WHITEBOARD_DIAGRAM" | "GENERATE_TEMPLATE_APP" | "UPDATE_SETTINGS",
    "payload": {
      // For CREATE_BOARD:
      // { "name": string, "color": string ("bg-sky-500" | "bg-violet-500" | "bg-orange-500" | "bg-rose-500" | "bg-emerald-500" | "bg-amber-500") }
      //
      // For ADD_KANBAN_TASK:
      // { "boardId": string, "columnName": string, "task": { "title": string, "description": string, "priority": "low"|"medium"|"high", "dueDate": "YYYY-MM-DD" } }
      //
      // For ADD_CALENDAR_TASK:
      // { "title": string, "notes": string, "date": "YYYY-MM-DD", "time": "HH:MM", "type": "task"|"reminder", "category": "focus"|"home"|"work"|"wellness"|"finance" }
      //
      // For CREATE_NOTE:
      // { "title": string, "content": string, "color": "gray"|"blue"|"green"|"pink"|"purple"|"yellow", "icon": string (e.g. "FileText") }
      //
      // For UPDATE_NOTE:
      // { "id": string, "title": string, "content": string, "color": string, "icon": string }
      //
      // For CREATE_WHITEBOARD_DIAGRAM:
      // { "name": string, "color": string, "prompt": string, "diagramType": "flowchart" | "mindmap" | "architecture" | "journey" | "process" }
      //
      // For GENERATE_TEMPLATE_APP:
      // { "appName": string, "prompt": string }
      //
      // For UPDATE_SETTINGS:
      // { "theme": "light" | "dark" | "cozy" }
    }
  }
}`;

    // 3. Map messages to Gemini API contents
    // Gemini roles: user, model
    const contents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // 4. Send request to Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents,
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error in chat route:", errText);
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    let responseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    // Clean markdown fences if returned despite prompt
    if (responseText.startsWith("```")) {
      responseText = responseText.replace(/^```json\s*/, "").replace(/```$/, "").trim();
    }

    try {
      const parsed = JSON.parse(responseText);
      return NextResponse.json(parsed);
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON. Content:", responseText, parseError);
      return NextResponse.json({
        message: responseText || "I encountered an error parsing the visual elements. Please try rephrasing.",
        action: null,
      });
    }
  } catch (error: any) {
    console.error("Chat API Exception:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// -------------------------------------------------------------
// MOCK CHAT GENERATOR (FOR LOCAL TESTING WITHOUT KEY)
// -------------------------------------------------------------
function getMockChatResponse(messages: any[], currentTime: string) {
  const lastMsg = messages[messages.length - 1]?.content || "";
  const query = lastMsg.toLowerCase();

  let message = "I am a cozy helper. How can I assist you with tasks, notes, or templates today?";
  let action: any = null;

  if (query.includes("calendar") || query.includes("meeting") || query.includes("schedule")) {
    if (!query.match(/\d{4}-\d{2}-\d{2}/) && !query.includes("tomorrow") && !query.includes("today")) {
      message = "I'd love to schedule that on your calendar! What date and time should I block out, and which category (Focus, Home, Work, Wellness, Finance) does it fit best?";
    } else {
      // Mock schedule task
      const targetDate = query.includes("tomorrow") ? "2026-06-06" : "2026-06-05";
      message = `I've prepared a calendar proposal for **${lastMsg}** on **${targetDate}**! Click confirm to save it.`;
      action = {
        type: "ADD_CALENDAR_TASK",
        payload: {
          title: lastMsg.replace(/schedule/gi, "").replace(/add/gi, "").trim(),
          notes: "Scheduled via Cozy AI Assistant",
          date: targetDate,
          time: "10:00",
          type: "task",
          category: "work",
        },
      };
    }
  } else if (query.includes("kanban") || query.includes("board") || query.includes("task")) {
    if (query.includes("create a board") || query.includes("new board")) {
      message = "I'll help you start a new Kanban Board. What would you like to name it?";
      if (query.replace(/(create a board|new board|board)/g, "").trim().length > 1) {
        const boardName = lastMsg.replace(/create a board named/gi, "").replace(/create a board/gi, "").replace(/new board/gi, "").trim();
        message = `I have set up a new Kanban board proposal named **"${boardName}"** in Sky Blue. Confirm to create it!`;
        action = {
          type: "CREATE_BOARD",
          payload: {
            name: boardName,
            color: "bg-sky-500",
          },
        };
      }
    } else {
      message = "To add a task to a board, please let me know the board name. I can add it to your columns in real time!";
    }
  } else if (query.includes("note")) {
    if (query.includes("create") || query.includes("new")) {
      const noteTitle = lastMsg.replace(/create a note titled/gi, "").replace(/create a note/gi, "").replace(/new note/gi, "").trim() || "AI Draft Note";
      message = `I proposed to write a new note **"${noteTitle}"** in your notes drawer. Confirm below to save it.`;
      action = {
        type: "CREATE_NOTE",
        payload: {
          title: noteTitle,
          content: "### Notes Drafted by AI\n\n- Created via assistant central prompt.",
          color: "rose",
          icon: "NotebookPen",
        },
      };
    } else {
      message = "I can create new notes or summarize and refine existing note content. Let me know what you'd like to draft!";
    }
  } else if (query.includes("theme") || query.includes("dark mode") || query.includes("light mode")) {
    const isDark = query.includes("dark");
    message = `Let me adjust the workspace settings. Click confirm to switch your interface setting to **${isDark ? "dark" : "light"}** mode.`;
    action = {
      type: "UPDATE_SETTINGS",
      payload: {
        theme: isDark ? "dark" : "light",
      },
    };
  } else if (query.includes("diagram") || query.includes("flowchart") || query.includes("whiteboard")) {
    message = "I will create a flowchart of the system architecture on a new whiteboard. Confirm to deploy it.";
    action = {
      type: "CREATE_WHITEBOARD_DIAGRAM",
      payload: {
        name: "AI Flowchart Diagram",
        color: "bg-violet-500",
        prompt: lastMsg,
        diagramType: "flowchart",
      },
    };
  } else if (query.includes("habit") || query.includes("tracker") || query.includes("template")) {
    message = "I will launch the AI App Template builder to construct a Habit Tracker app for you. Confirm to generate!";
    action = {
      type: "GENERATE_TEMPLATE_APP",
      payload: {
        appName: "Cozy Habit Tracker",
        prompt: "A gorgeous Habit tracker dashboard with stats, checklists, progress bars, and historical tables.",
      },
    };
  }

  return { message, action };
}
