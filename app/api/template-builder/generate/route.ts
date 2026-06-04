import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { aiTemplates } from "@/db/schema";

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { prompt } = await request.json();

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    let appConfig: any;
    let isMock = false;

    if (!apiKey || apiKey === "sk_test_placeholder" || apiKey.includes("placeholder")) {
      console.warn("GEMINI_API_KEY is not configured or placeholder. Using mock generation.");
      appConfig = getMockAppConfig(prompt);
      isMock = true;
    } else {
      try {
        appConfig = await generateAppConfigWithGemini(prompt, apiKey);
      } catch (geminiError) {
        console.error("Gemini template generation failed, falling back to mock:", geminiError);
        appConfig = getMockAppConfig(prompt);
        isMock = true;
      }
    }

    // Save the template in database
    const templateId = `app-${crypto.randomUUID()}`;
    const [savedTemplate] = await db
      .insert(aiTemplates)
      .values({
        id: templateId,
        userId: userId,
        appName: appConfig.appName || "My Generated App",
        description: appConfig.description || "A cozy generated workspace.",
        icon: appConfig.icon || "Flame",
        color: appConfig.color || "#F97316",
        layout: appConfig.layout || "single-page",
        config: JSON.stringify(appConfig),
        inSidebar: false,
      })
      .returning();

    return NextResponse.json({
      ...savedTemplate,
      config: appConfig,
      mocked: isMock
    });
  } catch (error) {
    console.error("Error generating template:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

async function generateAppConfigWithGemini(userPrompt: string, apiKey: string): Promise<any> {
  const systemPrompt = `You are a world-class Product Designer and AI developer. Your goal is to design a clean, responsive, single-page mini-application layout represented as a structured JSON object based on the user's prompt: "${userPrompt}".

Generate a complete, fully functional visual layout that the user can immediately use. Use a creative theme, relevant sections, components, forms, progress trackers, lists, tables, checklist items, and buttons.

The returned JSON MUST STRICTLY adhere to this schema:
{
  "appName": "Name of the app (e.g. Budget Companion)",
  "description": "Short, catchy description.",
  "icon": "Lucide icon name (choose from: Flame, Target, DollarSign, Utensils, BookOpen, Heart, Activity, Calendar, Award, Zap, Smile, ShoppingBag, Checklist, Clock, Shield)",
  "color": "Theme color hex code matching the vibe (e.g., violet: #8B5CF6, orange: #F97316, emerald: #10B981, rose: #F43F5E, cyan: #06B6D4, amber: #F59E0B)",
  "layout": "single-page",
  "sections": [
    {
      "id": "Unique string ID (e.g., stats-section)",
      "title": "Title of the section",
      "type": "stats | checklist | list | table | form | chart-placeholder",
      "components": [
        // For type = "stats":
        {
          "type": "stat-card",
          "id": "unique-id",
          "label": "Card label (e.g. Monthly Budget)",
          "value": "Card value (e.g. $1,200)",
          "icon": "Lucide Icon name",
          "color": "Hex color code"
        },
        {
          "type": "progress-bar",
          "id": "unique-id",
          "label": "Label (e.g. Spending Limit)",
          "value": 65, // number from 0 to 100 representing percentage
          "color": "Hex color code"
        },
        
        // For type = "checklist":
        {
          "type": "checklist-item",
          "id": "unique-id",
          "label": "Actionable task (e.g. Drink water)",
          "checked": false // boolean
        },

        // For type = "list":
        {
          "type": "list-item",
          "id": "unique-id",
          "label": "Title of item",
          "description": "Short description of item",
          "tags": ["Array", "of", "strings"]
        },

        // For type = "table":
        {
          "type": "table-widget",
          "id": "unique-id",
          "headers": ["Array", "of", "column", "names"],
          "rows": [
            ["Array", "of", "row", "values"],
            ["matching", "headers", "length", "exactly"]
          ]
        },

        // For type = "form":
        {
          "type": "form-widget",
          "id": "unique-id",
          "targetSectionId": "ID of the section to add data to (e.g., history-section or habits-section or items-section)",
          "fields": [
            {
              "name": "fieldKey (e.g., item)",
              "label": "User-facing label",
              "type": "text | number | select",
              "placeholder": "Optional placeholder text",
              "options": ["Only if type is select", "Option 1", "Option 2"] // optional array
            }
          ],
          "submitButtonLabel": "Label for form button (e.g., Add Transaction)"
        },

        // For type = "chart-placeholder":
        {
          "type": "chart-widget",
          "id": "unique-id",
          "chartType": "bar | line",
          "label": "Chart Label (e.g. Expense Breakdown)",
          "dataPoints": [
            { "name": "Mon", "value": 45 },
            { "name": "Tue", "value": 80 }
          ]
        }
      ],
      "actions": [
        // Optional section-level action buttons
        {
          "id": "action-id",
          "label": "Button label (e.g., Reset Streaks)",
          "actionType": "primary | secondary | danger | success"
        }
      ]
    }
  ],
  "actions": [
    // Optional global page-level actions
    {
      "id": "global-action-1",
      "label": "Action (e.g., Export Data)",
      "actionType": "secondary"
    }
  ]
}

Ensure the generated template structure is fully formed, rich, populated with 3-5 rows of sample data, and immediately interactive. Make sure the targetSectionId on form components matches the ID of a section that is either a list, checklist, or table, so items submitted via the form can be added to that section in the UI!

CRITICAL: Return ONLY valid, minified JSON. Do not include markdown fences, backticks, or any explanation. Response must parse cleanly as a JSON object.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: systemPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error("Gemini API error in template builder:", errText);
    throw new Error(`Gemini API returned status ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    throw new Error("Empty response from Gemini API");
  }

  return JSON.parse(text);
}

function getMockAppConfig(prompt: string): any {
  const p = prompt.toLowerCase();
  
  if (p.includes("habit") || p.includes("streak") || p.includes("routine")) {
    return {
      appName: "Habit Tracker",
      description: "Build streaks, lock in habits, and track your daily consistency.",
      icon: "Flame",
      color: "#F97316",
      layout: "single-page",
      sections: [
        {
          id: "stats-section",
          title: "Consistency Stats",
          type: "stats",
          components: [
            {
              type: "stat-card",
              id: "stat-streak",
              label: "Current Streak",
              value: "8 Days 🔥",
              icon: "Zap",
              color: "#F97316"
            },
            {
              type: "stat-card",
              id: "stat-completion",
              label: "Completion Rate",
              value: "88%",
              icon: "Award",
              color: "#10B981"
            },
            {
              type: "progress-bar",
              id: "prog-today",
              label: "Daily Progress",
              value: 66,
              color: "#8B5CF6"
            }
          ]
        },
        {
          id: "habits-list",
          title: "Today's Checklist",
          type: "checklist",
          components: [
            { type: "checklist-item", id: "h1", label: "Drink 3L of water", checked: true },
            { type: "checklist-item", id: "h2", label: "Read 15 pages of a book", checked: true },
            { type: "checklist-item", id: "h3", label: "30-minute afternoon workout", checked: false },
            { type: "checklist-item", id: "h4", label: "Meditation / Breathwork", checked: false }
          ],
          actions: [
            { id: "reset-habits", label: "Reset Streaks", actionType: "danger" }
          ]
        },
        {
          id: "add-habit-form",
          title: "Add New Habit",
          type: "form",
          components: [
            {
              type: "form-widget",
              id: "habit-form",
              targetSectionId: "habits-list",
              fields: [
                { name: "label", label: "Habit Name", type: "text", placeholder: "e.g., Code for 1 hour" },
                { name: "timeOfDay", label: "Preferred Time", type: "select", options: ["Morning", "Afternoon", "Evening", "Anytime"] }
              ],
              submitButtonLabel: "Create Habit"
            }
          ]
        },
        {
          id: "history-table-sec",
          title: "Habit History (Past 5 Days)",
          type: "table",
          components: [
            {
              type: "table-widget",
              id: "history-table",
              headers: ["Habit Name", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
              rows: [
                ["Drink 3L of water", "Completed", "Completed", "Missed", "Completed", "Completed"],
                ["Read 15 pages", "Completed", "Completed", "Completed", "Missed", "Completed"],
                ["30-minute workout", "Missed", "Completed", "Completed", "Completed", "Missed"]
              ]
            }
          ]
        }
      ],
      actions: [
        { id: "export-data", label: "Export CSV Report", actionType: "secondary" }
      ]
    };
  }
  
  if (p.includes("budget") || p.includes("expense") || p.includes("money") || p.includes("finance")) {
    return {
      appName: "Budget Companion",
      description: "Monitor your expenses, track category limits, and grow your savings.",
      icon: "DollarSign",
      color: "#10B981",
      layout: "single-page",
      sections: [
        {
          id: "finance-stats",
          title: "Financial Health",
          type: "stats",
          components: [
            {
              type: "stat-card",
              id: "stat-balance",
              label: "Available Balance",
              value: "$2,450.00",
              icon: "Shield",
              color: "#10B981"
            },
            {
              type: "stat-card",
              id: "stat-expenses",
              label: "Month-to-Date Expenses",
              value: "$890.50",
              icon: "Activity",
              color: "#F43F5E"
            },
            {
              type: "progress-bar",
              id: "budget-pct",
              label: "Budget Used ($890 / $3,000 limit)",
              value: 30,
              color: "#F59E0B"
            }
          ]
        },
        {
          id: "expense-form-sec",
          title: "Log New Transaction",
          type: "form",
          components: [
            {
              type: "form-widget",
              id: "expense-form",
              targetSectionId: "transactions-list",
              fields: [
                { name: "label", label: "Merchant / Description", type: "text", placeholder: "e.g., Starbucks" },
                { name: "amount", label: "Amount ($)", type: "number", placeholder: "0.00" },
                { name: "category", label: "Category", type: "select", options: ["Food", "Transport", "Entertainment", "Utilities", "Shopping"] }
              ],
              submitButtonLabel: "Add Transaction"
            }
          ]
        },
        {
          id: "transactions-list",
          title: "Recent Transactions",
          type: "table",
          components: [
            {
              type: "table-widget",
              id: "transactions-table",
              headers: ["Merchant", "Category", "Amount", "Status"],
              rows: [
                ["Whole Foods", "Food", "$124.50", "Settled"],
                ["Uber Taxi", "Transport", "$24.00", "Settled"],
                ["Netflix Subscription", "Utilities", "$15.49", "Pending"],
                ["Gym Membership", "Entertainment", "$50.00", "Settled"]
              ]
            }
          ]
        },
        {
          id: "chart-sec",
          title: "Monthly Spending Trend",
          type: "chart-placeholder",
          components: [
            {
              type: "chart-widget",
              id: "expense-chart",
              chartType: "bar",
              label: "Weekly Outflow",
              dataPoints: [
                { name: "Week 1", value: 180 },
                { name: "Week 2", value: 310 },
                { name: "Week 3", value: 240 },
                { name: "Week 4", value: 160 }
              ]
            }
          ]
        }
      ],
      actions: [
        { id: "export-pdf", label: "Generate PDF Statement", actionType: "secondary" }
      ]
    };
  }

  if (p.includes("meal") || p.includes("food") || p.includes("diet") || p.includes("recipe")) {
    return {
      appName: "Cozy Meal Planner",
      description: "Plan your weekly recipes, generate grocery lists, and track nutrition goals.",
      icon: "Utensils",
      color: "#F43F5E",
      layout: "single-page",
      sections: [
        {
          id: "nutri-stats",
          title: "Daily Nutrition Target",
          type: "stats",
          components: [
            {
              type: "stat-card",
              id: "cal-target",
              label: "Calorie Goal",
              value: "1,850 / 2,200 kcal",
              icon: "Activity",
              color: "#F43F5E"
            },
            {
              type: "progress-bar",
              id: "protein-prog",
              label: "Protein Target (95g / 130g)",
              value: 73,
              color: "#06B6D4"
            }
          ]
        },
        {
          id: "meals-schedule",
          title: "Weekly Schedule",
          type: "table",
          components: [
            {
              type: "table-widget",
              id: "meals-table",
              headers: ["Day", "Breakfast", "Lunch", "Dinner", "Snack"],
              rows: [
                ["Monday", "Oatmeal with Blueberries", "Quinoa Grilled Chicken Salad", "Baked Salmon with Broccoli", "Greek Yogurt"],
                ["Tuesday", "Avocado Toast with Egg", "Turkey and Hummus Wrap", "Slow Cooker Beef Stew", "Mixed Almonds"],
                ["Wednesday", "Green Protein Smoothie", "Leftover Stew", "Lemon Butter Cod with Asparagus", "Protein Shake"],
                ["Thursday", "Chia Seed Pudding", "Quinoa Grilled Chicken Salad", "Vegetarian Lentil Curry", "Apple slices + Peanut Butter"]
              ]
            }
          ]
        },
        {
          id: "grocery-list",
          title: "Shopping Checklist",
          type: "checklist",
          components: [
            { type: "checklist-item", id: "g1", label: "Fresh salmon fillets (2 pcs)", checked: true },
            { type: "checklist-item", id: "g2", label: "Organic baby spinach (large tub)", checked: true },
            { type: "checklist-item", id: "g3", label: "Greek Yogurt (plain, fat-free)", checked: false },
            { type: "checklist-item", id: "g4", label: "Fresh blueberries and avocados", checked: false },
            { type: "checklist-item", id: "g5", label: "Almond milk (unsweetened)", checked: false }
          ]
        },
        {
          id: "add-grocery-form",
          title: "Add Grocery Item",
          type: "form",
          components: [
            {
              type: "form-widget",
              id: "grocery-form",
              targetSectionId: "grocery-list",
              fields: [
                { name: "label", label: "Ingredient / Item Name", type: "text", placeholder: "e.g., Eggs" },
                { name: "qty", label: "Category / Notes", type: "select", options: ["Produce", "Dairy", "Meat/Seafood", "Pantry", "Other"] }
              ],
              submitButtonLabel: "Add to Checklist"
            }
          ]
        }
      ]
    };
  }

  // Default Fallback Planner (Study or Tasks Tracker)
  return {
    appName: prompt.trim().split(" ").slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") + " Space",
    description: `A customized workspace generated dynamically for: "${prompt}".`,
    icon: "Target",
    color: "#8B5CF6",
    layout: "single-page",
    sections: [
      {
        id: "stats-section",
        title: "Overview",
        type: "stats",
        components: [
          {
            type: "stat-card",
            id: "stat-tasks",
            label: "Active Items",
            value: "12 Items",
            icon: "Checklist",
            color: "#8B5CF6"
          },
          {
            type: "progress-bar",
            id: "prog-done",
            label: "Task Completion Rate",
            value: 45,
            color: "#06B6D4"
          }
        ]
      },
      {
        id: "items-section",
        title: "Workspace Items & Logs",
        type: "list",
        components: [
          { type: "list-item", id: "i1", label: "Review research materials", description: "Read chapters 3 to 5 on cognitive planning tools.", tags: ["High Priority", "Reading"] },
          { type: "list-item", id: "i2", label: "Update weekly action plan", description: "Synthesize notes and list targets for the weekend.", tags: ["Planning"] },
          { type: "list-item", id: "i3", label: "Draft outline for main project", description: "Create visual layout sketch on Miro whiteboard.", tags: ["Creative", "Draft"] }
        ]
      },
      {
        id: "item-form-sec",
        title: "Log New Task / Entry",
        type: "form",
        components: [
          {
            type: "form-widget",
            id: "entry-form",
            targetSectionId: "items-section",
            fields: [
              { name: "label", label: "Item Title", type: "text", placeholder: "e.g., Schedule sync meeting" },
              { name: "description", label: "Short Description", type: "text", placeholder: "Explain briefly..." },
              { name: "tag", label: "Category Tag", type: "select", options: ["High Priority", "Normal", "Low Priority", "Learning", "Personal"] }
            ],
            submitButtonLabel: "Add Workspace Item"
          }
        ]
      }
    ]
  };
}
