import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  let prompt = "";
  let diagramType = "flowchart";

  try {
    const body = await request.json();
    prompt = body.prompt || "";
    diagramType = body.diagramType || "flowchart";

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ nodes: [], edges: [] });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "sk_test_placeholder" || apiKey.includes("placeholder")) {
      console.warn("GEMINI_API_KEY is not configured or placeholder. Using mock diagram.");
      const mockResult = getMockDiagram(prompt, diagramType);
      return NextResponse.json(mockResult);
    }

    const systemPrompt = `You are a professional software architect and visual designer.
Your task is to generate a structured diagram based on the user's description.
You must return ONLY a JSON object representing the nodes (shapes) and edges (arrows) of the diagram. Do NOT wrap it in markdown backticks or include any conversational filler. Return raw JSON.

The diagram type requested is: "${diagramType}".
Supported types:
- "flowchart": vertical or horizontal layout of steps with decision diamonds.
- "mindmap": radial layout with a central node and branching topics.
- "architecture": system components (e.g. client, api, db, cache) with networking connections.
- "journey": horizontal layout representing steps in a user's experience.
- "process": step-by-step workflow.

JSON Schema:
{
  "nodes": [
    {
      "id": "string (unique node ID, e.g. 'n1')",
      "type": "string ('rectangle' | 'ellipse' | 'diamond')",
      "label": "string (text label inside the node)",
      "x": "number (X position, spread them out nicely: nodes should not overlap, usually 200-300px spacing)",
      "y": "number (Y position, spread them out nicely: nodes should not overlap, usually 150-250px spacing)",
      "w": "number (width of node, default 160. Make it larger for long text)",
      "h": "number (height of node, default 80)",
      "color": "string ('yellow' | 'mint' | 'blue' | 'coral' | 'purple' | 'white')"
    }
  ],
  "edges": [
    {
      "id": "string (unique edge ID, e.g. 'e1')",
      "from": "string (ID of source node)",
      "to": "string (ID of target node)",
      "label": "string (optional label for the connection arrow, keep it very short or omit)"
    }
  ]
}

Layout Guidelines:
1. "flowchart": Use 'rectangle' for steps, 'diamond' for decisions, 'ellipse' for Start/End. Nodes flow vertically (top to bottom) or horizontally.
2. "mindmap": Central node in the middle (e.g. x:400, y:300) with 'ellipse' shape. Children branch outwards in all directions with lines connecting them. Use distinct colors for different branches.
3. "architecture": Arrange clients at the top/left, servers in the middle, and databases/services at the bottom/right. Use 'rectangle' for boxes.
4. "journey": Arrange nodes horizontally from left to right (e.g., step 1 at x:100, step 2 at x:350, step 3 at x:600, etc.). Use 'rectangle' for actions.
5. "process": Sequential flow, either horizontal or vertical.

CRITICAL: Return ONLY valid, parseable JSON. Do not include markdown code block syntax (like \`\`\`json). The entire response must be a JSON object.`;

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
                  text: `${systemPrompt}\n\nUser prompt: "${prompt}"`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error response:", errText);
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    let responseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    
    // Attempt to clean markdown backticks if returned
    if (responseText.startsWith("```")) {
      responseText = responseText.replace(/^```json\s*/, "").replace(/```$/, "").trim();
    }

    try {
      const diagramData = JSON.parse(responseText);
      return NextResponse.json(diagramData);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON. Response was:", responseText, parseError);
      // Return a basic mock/fallback rather than failing
      return NextResponse.json(getMockDiagram(prompt, diagramType));
    }

  } catch (error) {
    console.error("AI Diagram Gen Error:", error);
    return NextResponse.json(getMockDiagram(prompt, diagramType));
  }
}

function getMockDiagram(prompt: string, type: string) {
  // Generate a fallback mock diagram based on type
  const nodes = [];
  const edges = [];

  if (type === "mindmap") {
    nodes.push(
      { id: "n1", type: "ellipse", label: prompt.slice(0, 30), x: 300, y: 250, w: 180, h: 80, color: "purple" },
      { id: "n2", type: "rectangle", label: "Idea A", x: 100, y: 150, w: 140, h: 60, color: "blue" },
      { id: "n3", type: "rectangle", label: "Idea B", x: 500, y: 150, w: 140, h: 60, color: "mint" },
      { id: "n4", type: "rectangle", label: "Idea C", x: 300, y: 400, w: 140, h: 60, color: "yellow" }
    );
    edges.push(
      { id: "e1", from: "n1", to: "n2" },
      { id: "e2", from: "n1", to: "n3" },
      { id: "e3", from: "n1", to: "n4" }
    );
  } else if (type === "architecture") {
    nodes.push(
      { id: "n1", type: "rectangle", label: "Client Browser", x: 100, y: 100, w: 150, h: 70, color: "blue" },
      { id: "n2", type: "rectangle", label: "Load Balancer", x: 300, y: 100, w: 150, h: 70, color: "white" },
      { id: "n3", type: "rectangle", label: "API Gateway", x: 500, y: 100, w: 150, h: 70, color: "mint" },
      { id: "n4", type: "rectangle", label: "Auth Service", x: 300, y: 220, w: 140, h: 60, color: "coral" },
      { id: "n5", type: "rectangle", label: "Database (PostgreSQL)", x: 500, y: 220, w: 160, h: 70, color: "yellow" }
    );
    edges.push(
      { id: "e1", from: "n1", to: "n2" },
      { id: "e2", from: "n2", to: "n3" },
      { id: "e3", from: "n3", to: "n4" },
      { id: "e4", from: "n3", to: "n5" }
    );
  } else if (type === "flowchart") {
    nodes.push(
      { id: "n1", type: "ellipse", label: "Start", x: 300, y: 50, w: 100, h: 50, color: "white" },
      { id: "n2", type: "rectangle", label: "Process Input", x: 275, y: 140, w: 150, h: 60, color: "yellow" },
      { id: "n3", type: "diamond", label: "Is Valid?", x: 285, y: 240, w: 130, h: 90, color: "blue" },
      { id: "n4", type: "rectangle", label: "Success Action", x: 150, y: 380, w: 140, h: 60, color: "mint" },
      { id: "n5", type: "rectangle", label: "Show Error", x: 410, y: 380, w: 140, h: 60, color: "coral" },
      { id: "n6", type: "ellipse", label: "End", x: 300, y: 480, w: 100, h: 50, color: "white" }
    );
    edges.push(
      { id: "e1", from: "n1", to: "n2" },
      { id: "e2", from: "n2", to: "n3" },
      { id: "e3", from: "n3", to: "n4", label: "Yes" },
      { id: "e4", from: "n3", to: "n5", label: "No" },
      { id: "e5", from: "n4", to: "n6" },
      { id: "e6", from: "n5", to: "n6" }
    );
  } else {
    // Process / Journey fallback
    nodes.push(
      { id: "n1", type: "rectangle", label: "Phase 1: Research", x: 100, y: 150, w: 160, h: 70, color: "blue" },
      { id: "n2", type: "rectangle", label: "Phase 2: Design", x: 300, y: 150, w: 160, h: 70, color: "purple" },
      { id: "n3", type: "rectangle", label: "Phase 3: Deploy", x: 500, y: 150, w: 160, h: 70, color: "mint" }
    );
    edges.push(
      { id: "e1", from: "n1", to: "n2" },
      { id: "e2", from: "n2", to: "n3" }
    );
  }

  return { nodes, edges };
}
