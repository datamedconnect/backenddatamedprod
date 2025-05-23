const axios = require("axios");
require("dotenv").config();

// Fonction utilitaire pour extraire le JSON d'un bloc de code markdown
const extractJSON = (response) => {
  const regex = /```json\n([\s\S]*?)\n```/;
  const match = response.match(regex);
  if (match) {
    return match[1].trim(); // Retourne la chaîne JSON nettoyée
  }
  throw new Error("Aucun JSON trouvé dans la réponse");
};

const extractCVData = async (pdfText) => {
  const aiMessages = [
    {
      role: "system",
      content:
        "Vous êtes un assistant qui extrait des données structurées à partir de CV.",
    },
    {
      role: "user",
      content: `
        Veuillez extraire les informations du CV fourni (au format PDF ou texte) et les formater dans la structure JSON suivante. Traduisez toutes les informations extraites en français, même si le CV est rédigé en anglais. Pour les champs manquants, utilisez les valeurs par défaut suivantes : "" pour les chaînes de caractères, 0 pour les nombres, et [] pour les tableaux. Assurez-vous que les données extraites soient claires, pertinentes et bien présentées pour valoriser le profil du candidat auprès d’un client.

{
  "Name": "",  // Nom complet du candidat, extrait de l’en-tête ou de la section personnelle
  "Poste": [],  // Liste des titres professionnels ou rôles clés (ex. titres actuels, passés significatifs ou ciblés), tirés du résumé ou des expériences
  "Location": "",  // Localisation actuelle du candidat, si mentionnée (ville, région ou pays)
  "AnnéeExperience": 0,  // Nombre total d’années d’expérience professionnelle, calculé à partir des dates des expériences ou estimé si nécessaire
  "Age": 0,  // Âge du candidat, calculé à partir de la date de naissance si disponible, sinon 0
"Skills": [],  // Liste complète des compétences clés, extraites d’une section dédiée ET systématiquement complétées par les environnements techniques des expériences professionnelles  il doit Etre des Mot Clés si tu Trouves des Phrase Extracter des Mots Clés pas de phrase juste des Mots Clés
// "ExperienceProfessionnelle": [
    {
      "TitrePoste": "",  // Titre exact du poste occupé (ex. "Ingénieur Logiciel Senior")
      "NomEntreprise": "",  // Nom de l’entreprise ou organisation
      "Date": "",  // Période d’emploi au format "Mois Année - Mois Année" ou "Année - Année" ; utiliser "Présent" pour un emploi actuel
      "Localisation": "",  // Ville ou région où le poste a été exercé
      "Context": "",  // Brève description fonctionnelle du rôle ou du projet (ex. "Développement d’une plateforme Industrie 4.0")
      "Réalisation": [],  // Liste des réalisations concrètes et spécifiques (ex. "Réduction de 20% des temps de traitement")
      "TechnicalEnv": []  // Environnement technique utilisé : langages, outils, frameworks (ex. "Java, Spring, Docker")
    }
  ],
  Langue: [
    {
      Intitulé: "",
      Niveau: "",
    },
  ],
  "Formation": [
    {
      "Diplome": "",  // Intitulé exact du diplôme (ex. "Master en Informatique")
      "Ecole": "",  // Nom de l’établissement ou de l’université
      "Année": 0  // Année d’obtention du diplôme, ou 0 si non précisée
    }
  ],
  "Certifications": [
    {
      "Certif": "",  // Nom de la certification (ex. "AWS Certified Solutions Architect")
      "Organisme": "",  // Organisme ou entité délivrant la certification
      "AnnéeCertif": 0  // Année d’obtention, ou 0 si non précisée
    }
  ]
}

**Instructions supplémentaires :**
- **Traduction** : Si le CV est en anglais ou dans une autre langue, traduisez toutes les informations en français de manière naturelle et professionnelle.
- **"AnnéeExperience"** : Calculez le total des années d’expérience en prenant la date de début de la première expérience professionnelle et la date de fin de la dernière (ou "Présent" si en cours). Par exemple, une expérience de "Janvier 2015 - Décembre 2020" équivaut à 6 ans. S’il y a des chevauchements ou des lacunes, estimez raisonnablement en privilégiant une présentation valorisante.
- **"Age"** : Si la date de naissance est indiquée, calculez l’âge en soustrayant l’année de naissance de l’année actuelle (2023). Si seul l’âge est mentionné, utilisez cette valeur. Sinon, laissez à 0.
- **"Poste"** : Remplissez cette liste avec les titres professionnels significatifs ou ciblés, extraits du résumé, de l’en-tête ou des expériences clés. Si rien n’est spécifié, utilisez le titre du poste le plus récent.
- **"Skills"** : Privilégiez les compétences listées dans une section dédiée du CV. Si aucune section n’existe, identifiez les compétences pertinentes mentionnées dans les expériences ou les environnements techniques.
- **"ExperienceProfessionnelle"** : 
  - Extrayez le "TitrePoste" directement depuis les intitulés des postes dans le CV.
  - Pour "Date", utilisez le format exact si disponible (ex. "Mars 2018 - Présent"), sinon simplifiez en années (ex. "2018 - 2020").
  - "Description" doit résumer brièvement le rôle ou le projet, en mettant en avant son objectif principal.
  - "Réalisation" doit inclure des résultats mesurables ou des contributions spécifiques si disponibles (ex. "Lancement d’une application utilisée par 10 000 utilisateurs").
  - "TechnicalEnv" doit lister les technologies utilisées dans le poste, sans doublons inutiles.
- **"Formation" et "Certifications"** : Remplissez avec les informations explicites du CV, en veillant à la clarté et à la précision des intitulés.
- **Qualité** : Assurez-vous que le JSON final soit complet, cohérent et professionnel, adapté pour présenter le candidat à un client de manière convaincante. Évitez les champs vides si des données pertinentes sont présentes dans le CV.
        ${pdfText}
      `,
    },
  ];

  try {
    const response = await axios.post(
      "https://api.x.ai/v1/chat/completions",
      {
        messages: aiMessages,
        model: "grok-3-mini",
        stream: false,
        temperature: 0,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROK_API_KEY}`,
        },
      }
    );

    let content = response.data.choices[0].message.content.trim();

    // Vérifie si le contenu est entouré d'un bloc de code markdown
    if (content.startsWith("```json") && content.endsWith("```")) {
      content = extractJSON(content);
    }

    // Retourne le contenu nettoyé sous forme de chaîne
    return content;
  } catch (error) {
    throw new Error(
      `Erreur lors de l'extraction des données via l'API Grok : ${error.message}`
    );
  }
};

module.exports = { extractCVData };
