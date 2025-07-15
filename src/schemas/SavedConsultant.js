const { z } = require("zod");

const SavedConsultantSchema = z.object({
  client: z.string(), // ObjectId as string
  consultant: z.string(), // ObjectId as string
});

module.exports = SavedConsultantSchema;
