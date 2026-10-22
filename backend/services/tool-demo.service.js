const { chatWithOllama } = require("./ollama.service");
const { executeTool } = require("../tools/tool-registry");

async function runToolDemo(question) {
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
    {
      type: "function",
      function: {
        name: "getCurrentWeather",
        description:
          "Get current weather conditions for Bengaluru, including temperature, feels-like temperature, humidity, precipitation, and wind speed.",
        parameters: {
          type: "object",
          properties: {},
          required: [],
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
        "falls on, use dayOfWeek. Use the tool result and never guess." +
        "If asked about current weather in Bengaluru, use getCurrentWeather." +
        "Use the tool result and never invent weather measurements.",
    },
    {
      role: "user",
      content: question,
    },
  ];

  // First AI request: obtain an answer or tool requests.
  const firstData = await chatWithOllama({
    model: "gemma4:e2b",
    messages,
    tools: toolDefinitions,
    stream: false,
    options: { temperature: 0 },
  });

  const assistantMessage = firstData.message;

  if (!assistantMessage) {
    throw new Error("Ollama returned no assistant message.");
  }

  const toolCalls = assistantMessage.tool_calls ?? [];

  // The model can answer directly without using a tool.
  if (toolCalls.length === 0) {
    return {
      answer: assistantMessage.content ?? "",
      toolUsed: false,
    };
  }

  // Limit the number of calls in a single model response.
  if (toolCalls.length > 3) {
    throw new Error("Too many tool calls in one request.");
  }

  // Preserve the assistant's tool-request message.
  messages.push(assistantMessage);

  const toolResults = [];

  // Express executes each approved tool.
  for (const call of toolCalls) {
    const toolName = call.function?.name;
    const args = call.function?.arguments;

    const result = executeTool(toolName, args);

    toolResults.push({
      toolName,
      result,
    });

    // Add the result to the conversation for the model.
    messages.push({
      role: "tool",
      tool_name: toolName,
      content: String(result),
    });
  }

  // Second AI request: generate a final answer using tool results.
  const finalData = await chatWithOllama({
    model: "gemma4:e2b",
    messages,
    tools: toolDefinitions,
    stream: false,
    options: { temperature: 0 },
  });

  return {
    answer: finalData.message?.content ?? "",
    toolUsed: true,
    toolResults,
  };
}

module.exports = { runToolDemo };
