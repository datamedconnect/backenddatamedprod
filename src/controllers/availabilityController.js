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
      return res.status(400).json({
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
  <style>
    /* Reset styles for email clients */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; font-family: 'Helvetica Neue', Arial, sans-serif; }
    a { text-decoration: none; }
    /* Custom styles */
    .button { display: inline-block; padding: 12px 24px; background-color: #173A6D; color:rgb(255, 255, 255) !important; border-radius: 5px; font-weight: bold; text-align: center; }
    .button:hover { background-color: #0F2A4D; }
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .button { width: 100%; box-sizing: border-box; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F6F9; color: #333333;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F4F6F9;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="text-align: center; padding: 30px 20px 20px;">
              <img src="https://storage.googleapis.com/datamedconnect/logo.png" alt="Datamed Connect Logo" style="max-width: 150px; width: 100%; height: auto;" />
            </td>
          </tr>
          <!-- Title -->
          <tr>
            <td style="text-align: center; padding: 10px 20px;">
              <h1 style="font-size: 24px; font-weight: bold; color: #173A6D; margin: 0;">Mise à jour de Votre Disponibilité</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 20px 30px; font-size: 16px; line-height: 1.6; color: #333333;">
              <p style="margin: 0 0 20px;">Merci pour votre inscription à Datamed Connect. Pour mettre à jour votre disponibilité, veuillez cliquer sur le bouton ci-dessous :</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${UpdateURL}" class="button">Mettre à jour votre disponibilité</a>
              </p>
              <p style="margin: 20px 0 0; text-align: center;"><strong>Note importante :</strong> Ce lien est valable pendant 24 heures.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #F9FAFB; border-top: 1px solid #E5E7EB; text-align: center; font-size: 12px; color: #666666;">
              <p style="margin: 0 0 10px;">
                <a href="#" style="color: #173A6D; text-decoration: underline; margin: 0 8px;">Mentions légales</a> |
                <a href="#" style="color: #173A6D; text-decoration: underline; margin: 0 8px;">Politique de cookies</a> |
                <a href="#" style="color: #173A6D; text-decoration: underline; margin: 0 8px;">Politique de confidentialité</a>
              </p>
              <p style="margin: 0;">© 2025 - Datamed Connect - Conçu par DatamedConsulting</p>
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
