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
  <style>
    /* Reset styles for email clients */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; font-family: 'Helvetica Neue', Arial, sans-serif; }
    a { text-decoration: none; }
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F6F9; color: #333333;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F4F6F9;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" class="container">
          <tr>
            <td style="text-align: center; padding: 30px 20px 20px;">
              <img src="https://storage.googleapis.com/datamedconnect/logo.png" alt="Logo" style="max-width: 150px; width: 100%; height: auto;" />
            </td>
          </tr>
          <tr>
            <td style="text-align: center; font-size: 18px; font-weight: bold; padding: 10px 15px; color: #333333;">
              Nouvelle Demande de Support
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; font-size: 16px; line-height: 1.6; color: #333333;">
              <p style="margin: 0 0 20px;">Une nouvelle demande de support a été soumise avec les détails suivants :</p>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 5px; font-weight: bold; border-bottom: 1px solid #E5E7EB;">Nom :</td>
                  <td style="padding: 5px; border-bottom: 1px solid #E5E7EB;">${encode(name)}</td>
                </tr>
                <tr>
                  <td style="padding: 5px; font-weight: bold; border-bottom: 1px solid #E5E7EB;">Email :</td>
                  <td style="padding: 5px; border-bottom: 1px solid #E5E7EB;">${encode(email)}</td>
                </tr>
                <tr>
                  <td style="padding: 5px; font-weight: bold; border-bottom: 1px solid #E5E7EB;">Type de sujet :</td>
                  <td style="padding: 5px; border-bottom: 1px solid #E5E7EB;">${encode(subjectType)}</td>
                </tr>
                <tr>
                  <td style="padding: 5px; font-weight: bold; border-bottom: 1px solid #E5E7EB; vertical-align: top;">Message :</td>
                  <td style="padding: 5px; border-bottom: 1px solid #E5E7EB;">${encode(message)}</td>
                </tr>
              </table>
            </td>
          </tr>
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
