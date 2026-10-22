const { daysUntil, dayOfWeek } = require("./date.tools");

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

module.exports = { executeTool };
