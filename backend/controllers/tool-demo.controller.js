const { runToolDemo } = require("../services/tool-demo.service");

async function handleToolDemo(req, res) {
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

  try {
    // Delegate the AI tool-calling workflow to the service.
    const result = await runToolDemo(question.trim());

    return res.json(result);
  } catch (error) {
    console.error("Tool demo failed:", error);

    return res.status(502).json({
      error: "The AI tool demo failed.",
      details: error.message,
    });
  }
}

module.exports = { handleToolDemo };
