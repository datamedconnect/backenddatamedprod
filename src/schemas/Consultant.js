// Improved ConsultantSchema
const { z } = require("zod");

const ConsultantSchema = z.object({
  Email: z.string().email().optional(),
  Phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number").optional(),
  MissionType: z.string().optional(),
  TjmOrSalary: z.string().optional(),
  Age: z.number().min(18).max(100).optional(),
  Location: z.array(z.string()).min(0).optional(),
  Profile: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId").optional(),
  qualifiedBy: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId").optional(),
  sourcedBy: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId").optional(),
  status: z.enum(["Qualifié", "Non Qualifié", "En Attente"]).default("En Attente"),
  datamedFamily: z.boolean().default(false),
  available: z.coerce.date().optional(),
  lastUpdated: z.coerce.date().optional(),
}).strict();

module.exports = ConsultantSchema;