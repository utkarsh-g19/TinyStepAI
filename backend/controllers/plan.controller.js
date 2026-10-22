const { generatePlan } = require("../services/planner.service");

async function createPlan(req, res) {
  try {
    const { task } = req.body ?? {};

    // Validate the incoming request.
    if (typeof task !== "string" || !task.trim()) {
      return res.status(400).json({
        error: "Please provide a task.",
      });
    }

    // Delegate plan generation to the service.
    const plan = await generatePlan(task);

    return res.json({
      task: task.trim(),
      plan,
    });
  } catch (error) {
    console.error("AI request failed:", error);

    return res.status(502).json({
      error:
        "Could not generate a plan. Check that Ollama is running and the model is available.",
    });
  }
}

module.exports = { createPlan };
