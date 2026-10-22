const express = require("express");

const app = express();
const PORT = 3000;

// Allow Express to read JSON request bodies.
app.use(express.json());

function daysUntil(dateString) {
  // Accept only YYYY-MM-DD.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    throw new Error("Date must use YYYY-MM-DD format");
  }

  const [year, month, day] = dateString.split("-").map(Number);

  const target = new Date(Date.UTC(year, month - 1, day));

  // Reject impossible dates, such as 2026-02-30.
  if (
    target.getUTCFullYear() !== year ||
    target.getUTCMonth() !== month - 1 ||
    target.getUTCDate() !== day
  ) {
    throw new Error("Invalid calendar date");
  }

  const now = new Date();

  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.round((target.getTime() - today) / millisecondsPerDay);
}
function dayOfWeek(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    throw new Error("Date must use YYYY-MM-DD format");
  }

  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("Invalid calendar date");
  }

  const weekdays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return weekdays[date.getUTCDay()];
}
//AI Tools registry
const tools = {
  daysUntil: ({ dateString }) => daysUntil(dateString),
  dayOfWeek: ({ dateString }) => dayOfWeek(dateString),
};

//AI Tool dispatcher
function executeTool(toolName, args) {
  // 1. Reject tools that are not explicitly registered.
  if (!Object.hasOwn(tools, toolName)) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  // 2. Arguments must be a plain object.
  if (
    args === null ||
    typeof args !== "object" ||
    Array.isArray(args) ||
    Object.getPrototypeOf(args) !== Object.prototype
  ) {
    throw new Error("Tool arguments must be a plain object");
  }

  // 3. Validate arguments for the requested tool.
  if (["daysUntil", "dayOfWeek"].includes(toolName)) {
    if (Object.keys(args).length !== 1 || typeof args.dateString !== "string") {
      throw new Error(`${toolName} requires only a dateString string`);
    }
  }

  // 4. Execute only the approved function.
  return tools[toolName](args);
}

// A simple health-check endpoint.
app.get("/", (req, res) => {
  res.json({
    message: "TinyStep AI backend is running!",
  });
});

// Generate an AI-powered plan.
app.post("/api/plan", async (req, res) => {
  try {
    const { task } = req.body;

    if (!task || typeof task !== "string" || !task.trim()) {
      return res.status(400).json({
        error: "Please provide a task.",
      });
    }

    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemma4:e2b",
        stream: false, // making it true would allow us to receive the response word by word while the response is being generated. (simultaneous response generation and display)
        messages: [
          {
            role: "system",
            content: `You are TinyStep AI. Turn the user's goal into a realistic, encouraging plan with small, actionable steps. Include a brief title, numbered steps, and a suggested first action. Be concise. 
              Return ONLY a valid JSON object with this exact structure:
              {
                "title": "A short title for the plan",
                "description": "A brief overview of the plan",
                "tasks": [
                  {
                    "description": "A specific actionable task",
                    "duration_minutes": 30
                  },
                  {
                    "description": "Another actionable task",
                    "duration_minutes": 20
                  }
                ],
                "first_action": "The first thing the user should do"
              }

              Rules:
              - Include at least two tasks.
              - duration_minutes must be a number.
              - Use double quotes for JSON keys and string values.
              - Do not include Markdown fences or text outside the JSON object.`,
          },
          {
            role: "user",
            content: `Create a plan for this goal: ${task}`,
          },
        ],
        format: "json",
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama returned HTTP ${response.status}`);
    }

    const data = await response.json();

    let plan;

    try {
      plan = JSON.parse(data.message.content);
    } catch {
      throw new Error("The AI returned invalid JSON.");
    }

    if (
      !plan.title ||
      !plan.description ||
      !Array.isArray(plan.tasks) ||
      plan.tasks.length < 2 ||
      !plan.first_action
    ) {
      throw new Error("The AI returned an invalid plan structure.");
    }
    res.json({
      // our own response format to ensure consistency even when we change models
      task: task.trim(),
      plan,
    });
  } catch (error) {
    console.error("AI request failed:", error.message);

    res.status(502).json({
      error:
        "Could not generate a plan. Check that Ollama is running and the model is available.",
    });
  }
});

app.post("/api/tool-demo", async (req, res) => {
  const question = req.body?.question;

  // Validate the incoming request.
  if (
    typeof question !== "string" ||
    !question.trim() ||
    question.length > 500
  ) {
    return res.status(400).json({
      error: "Provide a question of up to 500 characters.",
    });
  }

  // Tell Ollama which function it is allowed to request.
  const toolDefinitions = [
    {
      type: "function",
      function: {
        name: "daysUntil",
        description: "Calculate days remaining until a date.",
        parameters: {
          type: "object",
          properties: {
            dateString: {
              type: "string",
              description: "Date in YYYY-MM-DD format.",
            },
          },
          required: ["dateString"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "dayOfWeek",
        description: "Find the weekday for a given date.",
        parameters: {
          type: "object",
          properties: {
            dateString: {
              type: "string",
              description: "Date in YYYY-MM-DD format.",
            },
          },
          required: ["dateString"],
        },
      },
    },
  ];

  const messages = [
    {
      role: "system",
      content:
        "You are a helpful assistant. If asked how many days remain " +
        "until a date, use daysUntil. If asked which weekday a date " +
        "falls on, use dayOfWeek. Use the tool result and never guess.",
    },
    {
      role: "user",
      content: question.trim(),
    },
  ];

  try {
    // CALL 1: Ask the model what to do.
    const firstResponse = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma4:e2b",
        messages,
        tools: toolDefinitions,
        stream: false,
        options: { temperature: 0 },
      }),
    });

    if (!firstResponse.ok) {
      const details = await firstResponse.text();
      throw new Error(`Ollama error: ${details}`);
    }

    const firstData = await firstResponse.json();
    const assistantMessage = firstData.message;

    if (!assistantMessage) {
      throw new Error("Ollama returned no assistant message.");
    }

    const toolCalls = assistantMessage.tool_calls ?? [];

    // The model may answer directly without requesting a tool.
    if (toolCalls.length === 0) {
      return res.json({
        answer: assistantMessage.content,
        toolUsed: false,
      });
    }

    // Limit execution in this learning demo.
    if (toolCalls.length > 3) {
      throw new Error("Too many tool calls in one request.");
    }

    // Preserve the model's tool request in the conversation.
    messages.push(assistantMessage);

    const toolResults = [];

    // EXPRESS executes the requested functions, not the AI.
    for (const call of toolCalls) {
      const toolName = call.function?.name;
      const args = call.function?.arguments;

      const result = executeTool(toolName, args);

      toolResults.push({ toolName, result });

      // Return each result to Ollama.
      messages.push({
        role: "tool",
        tool_name: toolName,
        content: String(result),
      });
    }

    // CALL 2: Ask the model to explain the tool result.
    const finalResponse = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma4:e2b",
        messages,
        tools: toolDefinitions,
        stream: false,
        options: { temperature: 0 },
      }),
    });

    if (!finalResponse.ok) {
      const details = await finalResponse.text();
      throw new Error(`Ollama final-response error: ${details}`);
    }

    const finalData = await finalResponse.json();

    return res.json({
      answer: finalData.message?.content ?? "",
      toolUsed: true,
      toolResults,
    });
  } catch (error) {
    console.error("Tool demo failed:", error);

    return res.status(502).json({
      error: "The AI tool demo failed.",
      details: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`TinyStep AI running at http://localhost:${PORT}`);
});
