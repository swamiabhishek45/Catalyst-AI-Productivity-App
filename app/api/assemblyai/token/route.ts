import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const apiKey = process.env.ASSEMBLYAI_API_KEY;

  if (!apiKey || apiKey === "your_assemblyai_api_key_here" || apiKey === "") {
    return NextResponse.json(
      { error: "AssemblyAI API Key is not configured in the environment variables." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch("https://streaming.assemblyai.com/v3/token?expires_in_seconds=60", {
      method: "GET",
      headers: {
        "Authorization": apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AssemblyAI Token Endpoint Error:", errorText);
      return NextResponse.json(
        { error: `AssemblyAI API returned status ${response.status}: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("AssemblyAI Token Generation Exception:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch AssemblyAI temporary token" },
      { status: 500 }
    );
  }
}
