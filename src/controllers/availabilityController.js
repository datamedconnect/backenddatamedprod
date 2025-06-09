const Consultant = require("../models/Consultant");
const { sendEmail } = require("../services/emailService");
const jwt = require("jsonwebtoken");

const getAllavaibility = async (req, res) => {
  try {
    const consultants = await Consultant.find({}).populate("Profile");

    const response = consultants.map((consultant) => ({
      _id: consultant._id.toString(), // Include the consultant's ID
      name: consultant.Profile ? consultant.Profile.Name || "-" : "-",
      email: consultant.Email || "-",
      phone: consultant.Phone || "-",
      availability: consultant.available || "-",
      lastUpdated: consultant.lastUpdated || "-",
    }));

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching consultant availability:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const sendAvaibility = async (req, res) => {
  try {
    // Extract consultantId from request body
    const { consultantId } = req.body;

    // Validate input
    if (!consultantId) {
      return res.status(400).json({ message: "L'ID du consultant est requis" });
    }

    // Find the consultant by ID
    const consultant = await Consultant.findById(consultantId).select("Email");

    // Check if consultant exists
    if (!consultant) {
      return res.status(404).json({ message: "Consultant non trouvé" });
    }

    // Check if email exists
    if (!consultant.Email) {
      return res
        .status(400)
        .json({
          message: "Aucune adresse email disponible pour ce consultant",
        });
    }

    // Include creation time in the token
    const createdAt = new Date().toISOString();
    const token = jwt.sign(
      { consultantId, createdAt },
      process.env.JWT_SECRET || "your_jwt_secret"
    );

    // Construct the UpdateURL with consultantId and token
    const UpdateURL = `https://datamedconnect.com/availability?id=${consultantId}&token=${token}`;

    // Send email
    const subject = "Mise à jour de disponibilité";
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Mise à jour de Votre Disponibilité - Datamed Connect</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 10px; background-color: #f5f5f5; color: #000000;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; border: 1px solid #555555; border-radius: 15px; background-color: #ffffff;">
                <tr>
                  <td style="text-align: center; padding: 20px 10px;">
                    <img src="https://media-hosting.imagekit.io/e0ef119c9b7f46a4/logo.png?Expires=1838884151&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=SD~YyZD-QpQkqWVeTCjFR8Hj9hko~Xq0gA9IGxR1WcrIJdFltcgAzXApdh4geqfzeb89XRh~3ZrqbYxPqmDR6XgOlWzVDpPBov8PwZuuxFDX7qFBaUpU0KfMfRX-5Spr4WGL9L3Q0Wb94k8d9jJJIv3fGh0Djm2r6MqyVrG6rEt8ffsLsuAk8Hd3vuqO5jUOEzcLo-GSTXp2y0QbeYJS5hNxUZu-rcjeJrzIyZPSJfE~frdChIdqGhLaSfJa8M0Q0DcuK4WZPbmJ0ZdsySo7-mVeoaeH4aUrNoqSKuPyu9I~2CIUn9-uu0hHCjvvZ650YQ7Dt8p8CBPCR3psIVUwqA__" alt="Logo" style="max-width: 150px; width: 100%; height: auto;" />
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center; font-size: 18px; font-weight: bold; padding: 10px 15px; color: #000000;">
                    Mise à jour de Votre Disponibilité sur Datamed Connect !
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px;">
                    <p>Merci pour votre inscription. Veuillez cliquer sur le lien ci-dessous pour mettre à jour votre disponibilité :</p>
                    <p><a href="${UpdateURL}" style="color: #0066cc; text-decoration: underline;">Cliquez ici pour mettre à jour votre disponibilité</a></p>
                    <p><strong>Note importante :</strong> Ce lien est valable pendant 24 heures.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px; font-size: 11px; color: #666666; border-top: 1px solid #e0e0e0; text-align: center;">
                    <a href="#" style="font-size: 12px; color: #0066cc; text-decoration: underline; margin: 0 5px;">Mentions légales</a>
                    <a href="#" style="font-size: 12px; color: #0066cc; text-decoration: underline; margin: 0 5px;">Politique de cookies</a>
                    <a href="#" style="font-size: 12px; color: #0066cc; text-decoration: underline; margin: 0 5px;">Politique de confidentialité</a>
                    <br />
                    © 2025 - Datamed Connect - Conçu par DatamedConsulting
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await sendEmail(consultant.Email, subject, html);

    // Return success response
    return res.status(200).json({ message: "Email envoyé avec succès" });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    return res.status(500).json({ message: "Erreur serveur interne" });
  }
};

module.exports = {
  getAllavaibility,
  sendAvaibility,
};
