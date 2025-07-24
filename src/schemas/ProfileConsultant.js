// Improved ProfileConsultantSchema
const { z } = require("zod");

const ProfileConsultantSchema = z.object({
  Name: z.string().optional(),
  Poste: z.array(z.string()).optional(),
  Location: z.string().optional(),
  AnnéeExperience: z.number().min(0).optional(),
  Skills: z.array(z.string()).optional(),
  ExperienceProfessionnelle: z.array(
    z.object({
      TitrePoste: z.string().optional(),
      NomEntreprise: z.string().optional(),
      Date: z.string().optional(),
      Localisation: z.string().optional(),
      Context: z.string().optional(),
      Réalisation: z.array(z.string()).min(0).optional(),
      TechnicalEnv: z.array(z.string()).min(0).optional(),
    })
  ).optional(),
  Langue: z.array(
    z.object({
      Intitulé: z.string().optional(),
      Niveau: z.string().optional(),
    })
  ).optional(),
  Formation: z.array(
    z.object({
      Diplome: z.string().optional(),
      Ecole: z.string().optional(),
      Année: z.number().min(1900).optional(),
    })
  ).optional(),
  Certifications: z.array(
    z.object({
      Certif: z.string().optional(),
      Organisme: z.string().optional(),
      AnnéeCertif: z.number().min(1900).optional(),
    })
  ).optional(),
  ProfilePicture: z.string().url().nullable().default(null),
}).strict();

module.exports = ProfileConsultantSchema;