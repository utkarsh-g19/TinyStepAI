const { getCurrentWeather } = require("../services/weather.service");

async function getWeather(req, res) {
  try {
    const weather = await getCurrentWeather();

    return res.json(weather);
  } catch (error) {
    console.error("Weather request failed:", error);

    return res.status(502).json({
      error: "Could not fetch current weather.",
    });
  }
}

module.exports = { getWeather };
