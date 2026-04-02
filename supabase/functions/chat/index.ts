import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type IncomingMessage = {
  role: "user" | "assistant";
  content: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, characterPersonality, mode, cameraFrame } = await req.json() as {
      messages: IncomingMessage[];
      characterPersonality?: string;
      mode?: string;
      cameraFrame?: string;
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

    const hasCameraFrame = typeof cameraFrame === "string" && cameraFrame.startsWith("data:image");

    let systemPrompt = "";

    if (mode === "interview") {
      systemPrompt = `You are an expert interview coach on the XOVA platform. You:
- Ask realistic HR, technical, and behavioral interview questions
- Evaluate answers and provide constructive feedback
- Rate answers on a scale of 1-10
- Suggest improvements with example answers
- Cover different interview types: HR, technical, startup, behavioral
- Use markdown formatting for clarity
- Be encouraging but honest about areas for improvement
${hasCameraFrame ? "- Use the camera snapshot to provide delivery feedback (confidence, posture, eye contact, professionalism)" : ""}`;
    } else if (mode === "career") {
      systemPrompt = `You are a career guidance counselor on the XOVA platform. You:
- Help students discover career paths based on their interests and skills
- Provide detailed roadmaps for different careers (data science, web dev, AI, etc.)
- Suggest relevant skills, courses, and certifications
- Share industry insights and salary expectations
- Help with resume and portfolio advice
- Use markdown formatting with clear sections and lists`;
    } else if (mode === "startup") {
      systemPrompt = `You are a startup mentor on the XOVA platform. You:
- Help validate startup ideas
- Guide on business model creation
- Advise on MVP development
- Teach about funding, pitching, and growth strategies
- Share real-world startup examples and lessons
- Help with market analysis and competitor research
- Use markdown formatting for clarity`;
    } else if (characterPersonality) {
      systemPrompt = `${characterPersonality}

Additionally, you are an AI mentor on the XOVA platform. Your job is to help students learn. You:
- Explain concepts step by step in simple language
- Use analogies and real-world examples
- Celebrate student successes with enthusiasm
- Encourage students when they struggle
- Ask follow-up questions to check understanding
- Adapt your explanations based on the student's level
- Use markdown formatting for clarity (headers, bold, lists, code blocks)
- Stay in character at all times while being educational
- Support personal conversations — if a student says they're stressed, lonely, or emotional, respond with empathy and encouragement

Always be supportive, clear, and engaging. Keep responses concise but thorough.`;
    } else {
      systemPrompt = `You are XOVA, an AI mentor that behaves like a human tutor. You are warm, patient, encouraging, and knowledgeable.
- Explain concepts step by step
- Use analogies and real-world examples
- Celebrate successes, encourage struggles
- Use markdown formatting
- Be supportive, clear, engaging, and concise
- Support personal conversations with empathy`;
    }

    // Build messages — attach camera frame as multimodal content when present
    const buildMessages = () =>
      messages.map((msg, i) => {
        if (hasCameraFrame && i === messages.length - 1 && msg.role === "user") {
          return {
            role: "user",
            content: [
              { type: "text", text: msg.content },
              { type: "image_url", image_url: { url: cameraFrame } },
            ],
          };
        }
        return { role: msg.role, content: msg.content };
      });

    let response: Response;

    // Primary: Lovable AI Gateway (always available, no external key needed)
    if (LOVABLE_API_KEY) {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "system", content: systemPrompt }, ...buildMessages()],
          stream: true,
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });
    } else if (GROQ_API_KEY) {
      // Fallback: Groq
      response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          stream: true,
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });
    } else {
      throw new Error("No AI provider configured");
    }

    if (!response.ok) {
      if (response.status === 429 || response.status === 402) {
        const msg = response.status === 402
          ? "AI credits exhausted. Please add funds."
          : "Rate limit exceeded. Please wait a moment.";
        return new Response(JSON.stringify({ error: msg }), {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const t = await response.text();
      console.error("Chat provider error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
