// Improved BesionSchema
const { z } = require("zod");

const BesionSchema = z.object({
  createdBy: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"),
  nomClient: z.string().optional(),
  dateLimite: z.coerce.date(),
  poste: z.string().min(1),
  experience: z.number().min(0),
  mission: z.string().min(1),
  prixAchat: z.number().min(0),
  status: z.enum(["Ouvert", "Fermé"]).default("Ouvert"),
  consultantsScores: z.array(
    z.object({
      consultantId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"),
      score: z.number().min(0).max(100),
    })
  ).optional(),
}).strict();

module.exports = BesionSchema;