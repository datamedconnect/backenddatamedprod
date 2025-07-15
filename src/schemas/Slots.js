const { z } = require("zod");

const SlotsSchema = z.object({
  createdBy: z.string(), // ObjectId as string
  exchangeNumber: z.string().optional(), // Has default in Mongoose
  client: z.string(), // ObjectId as string
  consultants: z.string(), // ObjectId as string
  status: z.enum(["En Attente", "Confirmé", "Reporté"]).default("En Attente"),
  timeSlots: z
    .array(
      z.object({
        date: z.coerce.date(),
        day: z.enum([
          "Lundi",
          "Mardi",
          "Mercredi",
          "Jeudi",
          "Vendredi",
          "Samedi",
          "Dimanche",
        ]),
        startTime: z.string(),
        finishTime: z.string(),
      }),
    )
    .max(3),
  selectedTimeSlot: z
    .object({
      confirmedBy: z.string().optional(), // ObjectId as string
      date: z.coerce.date().optional(),
      day: z
        .enum([
          "Lundi",
          "Mardi",
          "Mercredi",
          "Jeudi",
          "Vendredi",
          "Samedi",
          "Dimanche",
        ])
        .optional(),
      startTime: z.string().optional(),
      finishTime: z.string().optional(),
    })
    .optional(),
});

module.exports = SlotsSchema;
