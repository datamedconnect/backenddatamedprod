const { z } = require("zod");

const ConsultantSchema = z.object({
  Email: z.string().optional(),
  Phone: z.string().optional(),
  MissionType: z.string().optional(),
  TjmOrSalary: z.string().optional(),
  Age: z.number().optional(),
  Location: z.array(z.string()).optional(),
  Profile: z.string().optional(), // ObjectId as string
  qualifiedBy: z.string().optional(), // ObjectId as string
  sourcedBy: z.string().optional(), // ObjectId as string
  status: z
    .enum(["Qualifié", "Non Qualifié", "En Attente"])
    .default("En Attente"),
  datamedFamily: z.boolean().default(false),
  available: z.coerce.date().optional(),
  lastUpdated: z.coerce.date().optional(),
});

module.exports = ConsultantSchema;
