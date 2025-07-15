const { z } = require("zod");

const RequestsSchema = z.object({
  companyName: z.string(),
  email: z.string(),
  commentaires: z.string(),
});

module.exports = RequestsSchema;
