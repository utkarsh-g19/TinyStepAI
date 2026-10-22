const express = require("express");
const { handleToolDemo } = require("../controllers/tool-demo.controller");

const router = express.Router();

router.post("/", handleToolDemo);

module.exports = router;
