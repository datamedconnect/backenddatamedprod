// New/Improved UserSchema (based on Mongoose)
const { z } = require("zod");

const UserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["client", "admin", "superadmin"]),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number").optional(),
  name: z.string().optional(),
  companyName: z.string().optional(),
  status: z.enum(["Activé", "Désactivé"]).default("Activé"),
  integrations: z.array(
    z.object({
      service: z.enum(["google"]),
      email: z.string().email(),
      tokens: z.object({
        access_token: z.string(),
        refresh_token: z.string().optional(),
        expiry_date: z.number().optional(),
      }),
    })
  ).optional(),
  last_verified_at: z.coerce.date().nullable().default(null),
}).strict();

module.exports = UserSchema;