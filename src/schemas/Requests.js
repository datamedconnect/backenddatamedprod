// Improved RequestsSchema
const { z } = require("zod");

const RequestsSchema = z.object({
  companyName: z.string().min(1),
  email: z.string().email(),
  commentaires: z.string().min(1),
}).strict();

module.exports = RequestsSchema;