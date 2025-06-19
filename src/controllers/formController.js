const { sendEmail } = require("../services/emailService");

const handleContactForm = async (req, res) => {
  const { prenom, nom, telephone, object, message } = req.body;

  // Input validation
  if (!prenom || !nom || !telephone || !object || !message) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const adminEmail = "datamedconnect@consultingdatamed.com";
  const subject = `Demande de Contact de ${prenom} ${nom}`;

  const html = `
      <!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Demande de Contact</title>
  <style>
    /* Reset styles for email clients */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; font-family: 'Helvetica Neue', Arial, sans-serif; }
    a { text-decoration: none; }
    /* Custom styles */
    .details-table td { padding: 10px; border-bottom: 1px solid #E5E7EB; }
    .details-table tr:last-child td { border-bottom: none; }
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .details-table td { display: block; width: 100%; box-sizing: border-box; }
      .details-table td:first-child { font-weight: bold; padding-bottom: 5px; }
      .details-table td:last-child { padding-top: 5px; }
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
              <img src="https://media-hosting.imagekit.io/09b0c46f011e4354/emailLogo.png?Expires=1838884440&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=F1sU3fAegsXLQrUgWvX-sUcyipMi-dgPi-PrSkaMCYl90M2S1es5jkZhsoqZn1wOLSCyc9WdekML~vsp5Y61eB9Ycuzo04W34j4K8kRzYTp0KcRZf63y3tf~b36JfxadlEFAt0eaZFebylMgJNpNlY7dtTzZNs-MURvMSJYgGtgiqdqBYsydoIb-wnrsPlQT2NTewts4ELTDz3lRGXpFW1zdjuopg1726od1OpjSiJ6BxQOOLQ8o5PVD9o7n-1e5MHUjjSywKBq8k9MvezJkVKGoiGjLk3HV-C9MlkTiHFJ5uSRy~nAg9jL2tv4rFkUjGDsa64zph16-o8P4yPQt5Q__" alt="Datamed Connect Logo" style="max-width: 150px; width: 100%; height: auto;" />
            </td>
          </tr>
          <!-- Title -->
          <tr>
            <td style="text-align: center; padding: 10px 20px;">
              <h1 style="font-size: 24px; font-weight: bold; color: #173A6D; margin: 0;">Nouvelle Demande de Contact</h1>
            </td>
          </tr>
          <!-- Contact Details -->
          <tr>
            <td style="padding: 20px 30px; font-size: 16px; line-height: 1.6; color: #333333;">
              <p style="margin: 0 0 20px;">Vous avez reçu une nouvelle demande de contact. Voici les détails :</p>
              <table class="details-table" style="width: 100%; border-collapse: collapse; font-size: 15px; color: #333333;">
                <tr>
                  <td style="font-weight: bold; width: 30%;">Prénom :</td>
                  <td>${prenom}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold; width: 30%;">Nom :</td>
                  <td>${nom}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold; width: 30%;">Téléphone :</td>
                  <td>${telephone}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold; width: 30%;">Objet :</td>
                  <td>${object}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold; width: 30%;">Message :</td>
                  <td>${message}</td>
                </tr>
              </table>
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

  try {
    await sendEmail(adminEmail, subject, html);
    return res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({
      message: "Failed to send email",
      error: error.message,
    });
  }
};

const handleDemoForm = async (req, res) => {
  const { companyName, email, questions } = req.body;

  // Input validation
  if (!companyName || !email || !questions) {
    return res
      .status(400)
      .json({ message: "Company name, email, and questions are required" });
  }

  const adminEmail = "datamedconnect@consultingdatamed.com";
  const subject = `Demande de démonstration de ${companyName}`;

  const html = `
      <!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Demande de Démonstration</title>
  <style>
    /* Reset styles for email clients */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; font-family: 'Helvetica Neue', Arial, sans-serif; }
    a { text-decoration: none; }
    /* Custom styles */
    .details-table td { padding: 10px; border-bottom: 1px solid #E5E7EB; }
    .details-table tr:last-child td { border-bottom: none; }
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .details-table td { display: block; width: 100%; box-sizing: border-box; }
      .details-table td:first-child { font-weight: bold; padding-bottom: 5px; }
      .details-table td:last-child { padding-top: 5px; }
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
              <img src="https://media-hosting.imagekit.io/e0ef119c9b7f46a4/logo.png?Expires=1838884151&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=SD~YyZD-QpQkqWVeTCjFR8Hj9hko~Xq0gA9IGxR1WcrIJdFltcgAzXApdh4geqfzeb89XRh~3ZrqbYxPqmDR6XgOlWzVDpPBov8PwZuuxFDX7qFBaUpU0KfMfRX-5Spr4WGL9L3Q0Wb94k8d9jJJIv3fGh0Djm2r6MqyVrG6rEt8ffsLsuAk8Hd3vuqO5jUOEzcLo-GSTXp2y0QbeYJS5hNxUZu-rcjeJrzIyZPSJfE~frdChIdqGhLaSfJa8M0Q0DcuK4WZPbmJ0ZdsySo7-mVeoaeH4aUrNoqSKuPyu9I~2CIUn9-uu0hHCjvvZ650YQ7Dt8p8CBPCR3psIVUwqA__" alt="Datamed Connect Logo" style="max-width: 150px; width: 100%; height: auto;" />
            </td>
          </tr>
          <!-- Title -->
          <tr>
            <td style="text-align: center; padding: 10px 20px;">
              <h1 style="font-size: 24px; font-weight: bold; color: #173A6D; margin: 0;">Nouvelle Demande de Démonstration</h1>
            </td>
          </tr>
          <!-- Contact Details -->
          <tr>
            <td style="padding: 20px 30px; font-size: 16px; line-height: 1.6; color: #333333;">
              <p style="margin: 0 0 20px;">Vous avez reçu une nouvelle demande de démonstration. Voici les détails :</p>
              <table class="details-table" style="width: 100%; border-collapse: collapse; font-size: 15px; color: #333333;">
                <tr>
                  <td style="font-weight: bold; width: 30%;">Nom de l'entreprise :</td>
                  <td>${companyName}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold; width: 30%;">Email :</td>
                  <td>${email}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold; width: 30%;">Questions ou commentaires :</td>
                  <td>${questions}</td>
                </tr>
              </table>
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
              <p style="margin: 0;">© 2025 - Datamed Connect - Conçu par Fares Safer</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

  try {
    // Send the email
    await sendEmail(adminEmail, subject, html);

    // Save the data to MongoDB
    const newRequest = new Requests({
      companyName,
      email,
      commentaires: questions,
    });
    await newRequest.save();

    return res
      .status(200)
      .json({ message: "Email sent and data saved successfully" });
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({
      message: "Failed to process request",
      error: error.message,
    });
  }
};

module.exports = { handleContactForm, handleDemoForm };
