const Consultant = require("../models/Consultant");
const { encode } = require("html-entities"); // Add this at the top
const SavedConsultant = require("../models/SavedConsultant");
const { sendEmail } = require("../services/emailService");
 
// Fonction utilitaire pour abréger le nom
const abbreviateName = (fullName) => {
  if (!fullName || typeof fullName !== "string") return null;
  const trimmed = fullName.trim();
  if (trimmed === "") return null;
  const words = trimmed.split(/\s+/);
  const initials = words.map((word) => word[0].toUpperCase());
  return initials.join("") + ".";
};

const getConsultantClient = async (req, res) => {
  try {
    const userId = req.user.id;

    const savedConsultants = await SavedConsultant.find({ client: userId }).select('consultant');
    const savedConsultantSet = new Set(savedConsultants.map(sc => sc.consultant.toString()));

    // Option 1: Fetch all consultants, or adjust the filter as needed
    const consultants = await Consultant.find({}).populate("Profile");
    console.log("Retrieved consultants:", consultants.map(c => ({ _id: c._id, Location: c.Location, Status: c.status })));

    const filteredConsultants = consultants.filter(consultant => {
      const name = consultant.Profile?.Name;
      return name && name !== "Non spécifié";
    });
    console.log("Filtered consultants:", filteredConsultants.map(c => ({ _id: c._id, Location: c.Location })));

    const result = filteredConsultants.map(consultant => ({
      _id: consultant._id,
      profileid: consultant.Profile._id,
      Name: consultant.Profile ? abbreviateName(consultant.Profile.Name) : null,
      Age: consultant.Age,
      Poste: consultant.Profile ? consultant.Profile.Poste : [],
      Available: consultant.available,
      Location: Array.isArray(consultant.Location) ? consultant.Location : [],
      AnnéeExperience: consultant.Profile ? consultant.Profile.AnnéeExperience : null,
      Skills: consultant.Profile ? consultant.Profile.Skills : [],
      TjmOrSalary: consultant.TjmOrSalary,
      isSaved: savedConsultantSet.has(consultant._id.toString())
    }));

    res.json(result);
  } catch (error) {
    console.error("Erreur :", error);
    res.status(500).json({ message: error.message });
  }
};

const sendsupport = async (req, res) => {
  const { name, email, selectedStatus, otherSubject, message } = req.body;

  // Validation
  let errors = [];
  if (!name || name.trim() === "") {
    errors.push("Name is required");
  }
  if (!email || email.trim() === "") {
    errors.push("Email is required");
  } else if (!/\S+@\S+\.\S+/.test(email)) {
    errors.push("Email is invalid");
  }
  if (!selectedStatus || selectedStatus === "All") {
    errors.push("Please select a subject type");
  }
  if (selectedStatus === "Autre" && (!otherSubject || otherSubject.trim() === "")) {
    errors.push("Please specify the subject");
  }
  if (!message || message.trim() === "") {
    errors.push("Message is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  // Determine subject type
  let subjectType = selectedStatus;
  if (selectedStatus === "Autre") {
    subjectType = otherSubject;
  }

  // Construct styled email content
  const html = `
  <!DOCTYPE html>
  <html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Nouvelle Demande de Support</title>
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
                Nouvelle Demande de Support
              </td>
            </tr>
            <tr>
              <td style="padding: 15px;">
                <p>Une nouvelle demande de support a été soumise avec les détails suivants :</p>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px; font-weight: bold;">Nom :</td>
                    <td style="padding: 5px;">${encode(name)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px; font-weight: bold;">Email :</td>
                    <td style="padding: 5px;">${encode(email)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px; font-weight: bold;">Type de sujet :</td>
                    <td style="padding: 5px;">${encode(subjectType)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px; font-weight: bold; vertical-align: top;">Message :</td>
                    <td style="padding: 5px;">${encode(message)}</td>
                  </tr>
                </table>
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

  const subject = `Nouvelle Demande de Support de ${name}`;

  try {
    await sendEmail("faressafer05@gmail.com", subject, html);
    res.status(200).json({ message: "Support request sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Failed to send support request" });
  }
};


module.exports = {
  getConsultantClient,
  sendsupport,
};
