const { z } = require("zod");

const NotificationSchema = z.object({
  user: z.string(), // ObjectId as string
  message: z.string(),
  read: z.boolean().default(false),
});

module.exports = NotificationSchema;
