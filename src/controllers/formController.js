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
  </head>
  <body
    style="
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 10px;
      background-color: #f5f5f5;
      color: #000000;
    "
  >
    <!-- Outer table for centering -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center">
          <!-- Main content table -->
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
            style="
              max-width: 600px;
              width: 100%;
              border: 1px solid #555555;
              border-radius: 15px;
              background-color: #ffffff;
            "
          >
            <!-- Logo Section -->
            <tr>
              <td style="text-align: center; padding: 20px 10px;">
                <img
                src="https://media-hosting.imagekit.io/09b0c46f011e4354/emailLogo.png?Expires=1838884440&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=F1sU3fAegsXLQrUgWvX-sUcyipMi-dgPi-PrSkaMCYl90M2S1es5jkZhsoqZn1wOLSCyc9WdekML~vsp5Y61eB9Ycuzo04W34j4K8kRzYTp0KcRZf63y3tf~b36JfxadlEFAt0eaZFebylMgJNpNlY7dtTzZNs-MURvMSJYgGtgiqdqBYsydoIb-wnrsPlQT2NTewts4ELTDz3lRGXpFW1zdjuopg1726od1OpjSiJ6BxQOOLQ8o5PVD9o7n-1e5MHUjjSywKBq8k9MvezJkVKGoiGjLk3HV-C9MlkTiHFJ5uSRy~nAg9jL2tv4rFkUjGDsa64zph16-o8P4yPQt5Q__"
                alt="Logo"
                  style="max-width: 150px; width: 100%; height: auto;"
                />
              </td>
            </tr>
            <!-- Heading Section -->
            <tr>
              <td
                style="
                  text-align: center;
                  font-size: 18px;
                  font-weight: bold;
                  padding: 10px 15px;
                  color: #000000;
                "
              >
                Vous avez reçu une nouvelle demande de contact :
              </td>
            </tr>
            <!-- Contact Details Section -->
            <tr>
              <td style="padding: 15px;">
                <table
                  style="
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                    font-size: 14px;
                    color: #000000;
                  "
                >
                  <tr>
                    <td style="font-weight: bold; padding: 5px 10px; width: 30%;">
                      Prénom :
                    </td>
                    <td style="padding: 5px 10px;">${prenom}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: bold; padding: 5px 10px; width: 30%;">
                      Nom :
                    </td>
                    <td style="padding: 5px 10px;">${nom}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: bold; padding: 5px 10px; width: 30%;">
                      Téléphone :
                    </td>
                    <td style="padding: 5px 10px;">${telephone}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: bold; padding: 5px 10px; width: 30%;">
                      Objet :
                    </td>
                    <td style="padding: 5px 10px;">${object}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: bold; padding: 5px 10px; width: 30%;">
                      Message :
                    </td>
                    <td style="padding: 5px 10px;">${message}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Footer Section -->
            <tr>
              <td
                style="
                  padding: 15px;
                  font-size: 11px;
                  color: #666666;
                  border-top: 1px solid #e0e0e0;
                  text-align: center;
                "
              >
                <a
                  href="#"
                  style="
                    font-size: 12px;
                    color: #0066cc;
                    text-decoration: underline;
                    margin: 0 5px;
                  "
                  >Mentions légales</a
                >
                <a
                  href="#"
                  style="
                    font-size: 12px;
                    color: #0066cc;
                    text-decoration: underline;
                    margin: 0 5px;
                  "
                  >Politique de cookies</a
                >
                <a
                  href="#"
                  style="
                    font-size: 12px;
                    color: #0066cc;
                    text-decoration: underline;
                    margin: 0 5px;
                  "
                  >Politique de confidentialité</a
                >
                <br />
                © 2025 - Datamed Connect - Site conçu par DatamedConsulting
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
  if (!companyName || !email) {
    return res
      .status(400)
      .json({ message: "Company name and email are required" });
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
  </head>
  <body
    style="
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 10px;
      background-color: #f5f5f5;
      color: #000000;
    "
  >
    <!-- Outer table for centering -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center">
          <!-- Main content table -->
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
            style="
              max-width: 600px;
              width: 100%;
              border: 1px solid #555555;
              border-radius: 15px;
              background-color: #ffffff;
            "
          >
            <!-- Logo Section -->
            <tr>
              <td style="text-align: center; padding: 20px 10px;">
                <img
                  src="https://media-hosting.imagekit.io/e0ef119c9b7f46a4/logo.png?Expires=1838884151&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=SD~YyZD-QpQkqWVeTCjFR8Hj9hko~Xq0gA9IGxR1WcrIJdFltcgAzXApdh4geqfzeb89XRh~3ZrqbYxPqmDR6XgOlWzVDpPBov8PwZuuxFDX7qFBaUpU0KfMfRX-5Spr4WGL9L3Q0Wb94k8d9jJJIv3fGh0Djm2r6MqyVrG6rEt8ffsLsuAk8Hd3vuqO5jUOEzcLo-GSTXp2y0QbeYJS5hNxUZu-rcjeJrzIyZPSJfE~frdChIdqGhLaSfJa8M0Q0DcuK4WZPbmJ0ZdsySo7-mVeoaeH4aUrNoqSKuPyu9I~2CIUn9-uu0hHCjvvZ650YQ7Dt8p8CBPCR3psIVUwqA__"
                  alt="Logo"
                  style="max-width: 150px; width: 100%; height: auto;"
                />
              </td>
            </tr>
            <!-- Heading Section -->
            <tr>
              <td
                style="
                  text-align: center;
                  font-size: 18px;
                  font-weight: bold;
                  padding: 10px 15px;
                  color: #000000;
                "
              >
                Vous avez reçu une nouvelle demande de démonstration :
              </td>
            </tr>
            <!-- Contact Details Section -->
            <tr>
              <td style="padding: 15px;">
                <table
                  style="
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                    font-size: 14px;
                    color: #000000;
                  "
                >
                  <tr>
                    <td style="font-weight: bold; padding: 5px 10px; width: 30%;">
                      Nom de l'entreprise :
                    </td>
                    <td style="padding: 5px 10px;">${companyName}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: bold; padding: 5px 10px; width: 30%;">
                      Email :
                    </td>
                    <td style="padding: 5px 10px;">${email}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: bold; padding: 5px 10px; width: 30%;">
                      Questions ou commentaires :
                    </td>
                    <td style="padding: 5px 10px;">${questions || "Aucun"}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Footer Section -->
            <tr>
              <td
                style="
                  padding: 15px;
                  font-size: 11px;
                  color: #666666;
                  border-top: 1px solid #e0e0e0;
                  text-align: center;
                "
              >
                <a
                  href="#"
                  style="
                    font-size: 12px;
                    color: #0066cc;
                    text-decoration: underline;
                    margin: 0 5px;
                  "
                  >Mentions légales</a
                >
                <a
                  href="#"
                  style="
                    font-size: 12px;
                    color: #0066cc;
                    text-decoration: underline;
                    margin: 0 5px;
                  "
                  >Politique de cookies</a
                >
                <a
                  href="#"
                  style="
                    font-size: 12px;
                    color: #0066cc;
                    text-decoration: underline;
                    margin: 0 5px;
                  "
                  >Politique de confidentialité</a
                >
                <br />
                © 2025 - Datamed Connect - Site conçu par FARES SAFER
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

module.exports = { handleContactForm, handleDemoForm };
