const { chatWithOllama } = require("./ollama.service");

async function generatePlan(task) {
  const data = await chatWithOllama({
    model: "gemma4:e2b",
    stream: false,
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
  });

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

  return plan;
}

module.exports = { generatePlan };
