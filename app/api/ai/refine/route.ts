import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { text, option } = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ refinedText: "" });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "sk_test_placeholder" || apiKey.includes("placeholder")) {
      console.warn("GEMINI_API_KEY is not configured or placeholder. Using mock refinement.");
      const mockResult = getMockRefinement(text, option);
      return NextResponse.json({ refinedText: mockResult, mocked: true });
    }

    const prompt = `You are a professional writing assistant. Your task is to refine the user's selected text based on the following instruction: "${option}".
    
Instruction mapping:
- "Improve grammar": Fix all spelling, grammar, punctuation, and capitalization errors.
- "Rephrase": Rewrite the text with different wording while preserving the core meaning to make it sound more natural.
- "Make shorter": Summarize the text or condense it to be as concise as possible.
- "Make longer": Expand the text with additional context, details, and clear phrasing.
- "Simplify language": Use simpler, more direct vocabulary and sentence structure.
- "Change tone": Rewrite the text to sound polished, professional, and clear.

CRITICAL: Return ONLY the refined/rewritten text. Do NOT wrap it in quotation marks. Do NOT include any introductory or concluding text, explanations, markdown backticks, or conversational phrases. Your entire response will be directly inserted into the document.

Text to refine:
"""
${text}
"""`;

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
                  text: prompt,
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
    const refinedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text;
    
    // Clean any unwanted wrapping quotation marks if they returned
    let cleaned = refinedText;
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.substring(1, cleaned.length - 1);
    } else if (cleaned.startsWith('`') && cleaned.endsWith('`')) {
      cleaned = cleaned.substring(1, cleaned.length - 1);
    }

    return NextResponse.json({ refinedText: cleaned });
  } catch (error) {
    console.error("AI Refine Error:", error);
    // Graceful fallback to mock even on API failure so user experience isn't broken
    try {
      const { text, option } = await request.json();
      const mockResult = getMockRefinement(text, option);
      return NextResponse.json({ refinedText: mockResult, error: true });
    } catch {
      return new Response("Internal Server Error", { status: 500 });
    }
  }
}

function getMockRefinement(text: string, option: string): string {
  const trimmed = text.trim();
  
  switch (option) {
    case "Improve grammar": {
      let t = trimmed;
      // Capitalize first letters of sentences
      t = t.replace(/(^\s*|[.!?]\s+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());
      // Capitalize lone 'i's
      t = t.replace(/\bi\b/g, "I");
      // Add missing period if none exists
      if (t && !/[.!?]$/.test(t)) {
        t += ".";
      }
      return t;
    }
    case "Make shorter": {
      if (trimmed.length <= 40) return trimmed;
      // Condense sentences
      const sentences = trimmed.split(/[.!?]+/);
      if (sentences.length > 1) {
        return sentences[0].trim() + ".";
      }
      return trimmed.slice(0, Math.floor(trimmed.length * 0.6)) + "...";
    }
    case "Make longer": {
      return `${trimmed} Furthermore, it is essential to consider the implications of this action. By expanding upon this concept, we can establish a more robust foundation and ensure that all relevant perspectives are thoroughly addressed.`;
    }
    case "Rephrase": {
      // Rephrase keywords
      let t = trimmed;
      t = t.replace(/\bwant to build\b/gi, "intend to construct");
      t = t.replace(/\bbuild a\b/gi, "develop a");
      t = t.replace(/\bcreate a\b/gi, "generate a");
      t = t.replace(/\bi think\b/gi, "it is my perspective that");
      t = t.replace(/\bneed to\b/gi, "ought to");
      
      if (t === trimmed) {
        return `Here is an alternative phrasing: ${trimmed.replace(/(^\w)/, c => c.toLowerCase())}`;
      }
      return t;
    }
    case "Simplify language": {
      let t = trimmed;
      t = t.replace(/\bfunctionality\b/gi, "features");
      t = t.replace(/\butilize\b/gi, "use");
      t = t.replace(/\bimplement\b/gi, "make");
      t = t.replace(/\bsubstantial\b/gi, "large");
      t = t.replace(/\bdetermine\b/gi, "find");
      return t;
    }
    case "Change tone": {
      return `Polished draft: I would like to clarify that ${trimmed.replace(/(^\w)/, c => c.toLowerCase())}`;
    }
    default:
      return trimmed;
  }
}
