// Improved SlotsSchema
const { z } = require("zod");

const SlotsSchema = z.object({
  createdBy: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"),
  exchangeNumber: z.string().startsWith("ECH-").optional(),
  client: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"),
  consultants: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"),
  status: z.enum(["En Attente", "Confirmé", "Reporté"]).default("En Attente"),
  timeSlots: z.array(
    z.object({
      date: z.coerce.date(),
      day: z.enum(["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]),
      startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format"),
      finishTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format"),
    })
  ).max(3),
  selectedTimeSlot: z.object({
    confirmedBy: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId").optional(),
    date: z.coerce.date().optional(),
    day: z.enum(["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]).optional(),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional(),
    finishTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional(),
  }).optional(),
}).strict();

module.exports = SlotsSchema;