const { z } = require("zod");

const BesionSchema = z.object({
  createdBy: z.string(), // ObjectId as string
  nomClient: z.string().optional(),
  dateLimite: z.coerce.date(),
  poste: z.string(),
  experience: z.number(),
  mission: z.string(),
  prixAchat: z.number(),
  status: z.enum(["Ouvert", "Fermé"]).default("Ouvert"),
  consultantsScores: z
    .array(
      z.object({
        consultantId: z.string(), // ObjectId as string
        score: z.number(),
      }),
    )
    .optional(),
});

module.exports = BesionSchema;

