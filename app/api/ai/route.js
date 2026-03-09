// /app/api/ai/route.js
// Proxies requests to Anthropic API so the key stays server-side

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: body.model || "claude-sonnet-4-20250514",
        max_tokens: body.max_tokens || 1000,
        system: body.system || undefined,
        messages: body.messages || [],
      }),
    });

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("AI proxy error:", error);
    return Response.json(
      { error: "Failed to call AI" },
      { status: 500 }
    );
  }
}
