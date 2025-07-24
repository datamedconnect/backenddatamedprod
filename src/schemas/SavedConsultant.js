// Improved SavedConsultantSchema
const { z } = require("zod");

const SavedConsultantSchema = z.object({
  client: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"),
  consultant: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"),
}).strict();

module.exports = SavedConsultantSchema;