const express = require("express");
const { createPlan } = require("../controllers/plan.controller");

const router = express.Router();

router.post("/", createPlan);

module.exports = router;
