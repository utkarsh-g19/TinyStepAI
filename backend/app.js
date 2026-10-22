const express = require("express");

const plannerRoutes = require("./routes/planner.routes");
const toolDemoRoutes = require("./routes/tool-demo.routes");
const weatherRoutes = require("./routes/weather.routes");

const app = express();

// Middleware: allow Express to read JSON request bodies.
app.use(express.json());

// Health-check endpoint.
app.get("/", (req, res) => {
  res.json({
    message: "TinyStep AI backend is running!",
  });
});

// Mount the route modules.
app.use("/api/plan", plannerRoutes);
app.use("/api/tool-demo", toolDemoRoutes);
app.use("/api/weather", weatherRoutes);

module.exports = app;
