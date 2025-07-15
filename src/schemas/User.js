const { z } = require("zod");

const UserSchema = z.object({
  email: z.string(),
  password: z.string(),
  role: z.enum(["client", "admin", "superadmin"]),
  phoneNumber: z.string().optional(),
  name: z.string().optional(),
  companyName: z.string().optional(),
  status: z.enum(["Activé", "Désactivé"]).default("Activé"),
  integrations: z
    .array(
      z.object({
        service: z.enum(["google"]),
        email: z.string(),
        tokens: z.object({
          access_token: z.string(),
          refresh_token: z.string().optional(),
          expiry_date: z.number().optional(),
        }),
      }),
    )
    .optional(),
  last_verified_at: z.coerce.date().nullable().default(null),
});

module.exports = UserSchema;
