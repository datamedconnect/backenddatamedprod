const Slots = require("../models/Slots");
const moment = require("moment"); // Add this import to fix the error
const Notification = require("../models/Notification");
const { sendEmail } = require("../services/emailService");


// Fonction utilitaire pour calculer les initiales à partir d'un nom
const getInitials = (name) => {
  if (!name) return "";
  const parts = name.split(" ");
  const initials = parts.map((part) => part[0].toUpperCase()).join("");
  return initials;
};

const createSlotAdmin = async (req, res) => {
  try {
    const slotData = {
      createdBy: req.user.id,
      client: req.user.id,
      consultants: req.body.consultants,
      status: req.body.status || "En Attente",
      timeSlots: req.body.timeSlots,
      selectedTimeSlot: req.body.selectedTimeSlot,
    };
    const newSlot = new Slots(slotData);
    await newSlot.save();

    res.status(201).json(newSlot);
  } catch (error) {
    console.error("Erreur lors de la création du créneau :", error);
    res.status(400).json({ message: error.message });
  }
};

const getAllSlotsAdmin = async (req, res) => {
  try {
    const slots = await Slots.find({ client: req.user.id })
      .populate({
        path: "consultants",
        populate: {
          path: "Profile",
          select: "Name Poste",
        },
      })
      .lean();

    const transformedSlots = slots.map((slot) => ({
      _id: slot._id,
      exchangeNumber: slot.exchangeNumber,
      status: slot.status,
      timeSlots: slot.timeSlots,
      consultants: slot.consultants
        ? {
            _id: slot.consultants._id,
            TjmOrSalary: slot.consultants.TjmOrSalary,
            Age: slot.consultants.Age,
            Location: slot.consultants.Location,
            Email: slot.consultants.Email,
            Profile: slot.consultants.Profile
              ? {
                  Name: slot.consultants.Profile.Name,
                  Poste: slot.consultants.Profile.Poste,
                  Initials: getInitials(slot.consultants.Profile.Name),
                }
              : null,
          }
        : null,
      selectedTimeSlot: slot.selectedTimeSlot,
      __v: slot.__v,
    }));

    res.json(transformedSlots);
  } catch (error) {
    console.error("Erreur lors de la récupération de tous les créneaux :", error);
    res.status(500).json({ message: error.message });
  }
};

const getSlotsByClient = async (req, res) => {
  try {
    const clientId = req.user.id;
    const slots = await Slots.find({ client: clientId })
      .populate("createdBy", "name email")
      .populate("client", "name email")
      .populate("consultants", "name");

    // Vérifier si des créneaux existent
    if (!slots || slots.length === 0) {
      return res
        .status(404)
        .json({ message: "Aucun créneau trouvé pour ce client" });
    }

    // Retourner les créneaux
    res.status(200).json(slots);
  } catch (error) {
    console.error("Erreur lors de la récupération des créneaux :", error);
    res.status(500).json({ message: "Erreur du serveur", error: error.message });
  }
};

const getSlotAdmin = async (req, res) => {
  try {
    const slot = await Slots.findById(req.params.id)
      .populate("client")
      .populate("consultants");
    if (!slot) {
      return res.status(404).json({ message: "Créneau non trouvé" });
    }

    res.json(slot);
  } catch (error) {
    console.error("Erreur lors de la récupération du créneau :", error);
    res.status(500).json({ message: error.message });
  }
};

// const updateSlotDetails = async (req, res) => {
//   try {
//     const { selectedTimeSlot } = req.body;
//     console.log("Received request to update slot with ID:", req.params.id);
//     console.log("Selected time slot received:", selectedTimeSlot);

//     if (!selectedTimeSlot || !selectedTimeSlot.confirmedBy) {
//       console.log("Missing required fields in request");
//       return res.status(400).json({ message: "Selected time slot and confirmedBy are required" });
//     }

//     const updateData = {
//       selectedTimeSlot: { ...selectedTimeSlot },
//       status: "Confirmé",
//     };
//     console.log("Data to update in database:", updateData);

//     const slot = await Slots.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate({
//       path: "consultants",
//       populate: { path: "Profile" },
//     });

//     if (!slot) {
//       console.log("Slot not found for ID:", req.params.id);
//       return res.status(404).json({ message: "Créneau non trouvé" });
//     }

//     console.log("Slot updated successfully:", slot);

//     // Generate notification
//     const initials = getInitials(slot.consultants.Profile.Name);
//     moment.locale("fr");
//     const day = slot.selectedTimeSlot.day;
//     const date = moment(slot.selectedTimeSlot.date).format("DD MMMM YYYY");
//     const message = `Le Demande D'Echange avec ${initials} a été Confirmé le ${day} ${date}`;

//     const notification = new Notification({
//       user: slot.createdBy,
//       message: message,
//     });
//     await notification.save();

//     // Emit notification via Socket.io
//     const io = req.app.get("io");
//     io.to(slot.createdBy.toString()).emit("newNotification", notification);

//     res.json(slot);
//   } catch (error) {
//     console.error("Error during slot update:", error);
//     res.status(400).json({ message: error.message });
//   }
// };

const updateSlotDetails = async (req, res) => {
  try {
    console.log("Step 1: Starting updateSlotDetails for slot ID:", req.params.id);
    const { selectedTimeSlot } = req.body;
    console.log("Step 2: Selected time slot received:", selectedTimeSlot);

    if (!selectedTimeSlot || !selectedTimeSlot.confirmedBy) {
      console.log("Step 3: Validation failed - Missing required fields");
      return res.status(400).json({ message: "Selected time slot and confirmedBy are required" });
    }
    console.log("Step 4: Validation passed - Required fields present");

    const updateData = {
      selectedTimeSlot: { ...selectedTimeSlot },
      status: "Confirmé",
    };
    console.log("Step 5: Prepared update data:", updateData);

    console.log("Step 6: Updating slot in database...");
    const slot = await Slots.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate({
      path: "consultants",
      populate: { path: "Profile" },
    });

    if (!slot) {
      console.log("Step 7: Slot not found for ID:", req.params.id);
      return res.status(404).json({ message: "Créneau non trouvé" });
    }
    console.log("Step 8: Slot updated successfully:", slot);

    console.log("Step 9: Generating notification...");
    const initials = getInitials(slot.consultants.Profile.Name);
    moment.locale("fr");
    const day = slot.selectedTimeSlot.day;
    const date = moment(slot.selectedTimeSlot.date).format("DD MMMM YYYY");
    const message = `Le Demande D'Echange avec ${initials} a été Confirmé le ${day} ${date}`;
    console.log("Step 10: Notification message created:", message);

    console.log("Step 11: Saving notification to database...");
    const notification = new Notification({
      user: slot.createdBy,
      message: message,
    });
    await notification.save();
    console.log("Step 12: Notification saved:", notification);

    console.log("Step 13: Emitting notification via Socket.io...");
    const io = req.app.get("io");
    io.to(slot.createdBy.toString()).emit("newNotification", notification);
    console.log("Step 14: Notification emitted to user:", slot.createdBy.toString());

    console.log("Step 15: Preparing to send confirmation email to consultant...");
    try {
      const consultantEmail = slot.consultants.Email;
      const consultantName = slot.consultants.Profile.Name;
      const formattedDate = moment(slot.selectedTimeSlot.date).format("DD MMMM YYYY");
      const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Echange Confirmé</title>
        <style>
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
                    Echange Confirmé
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 30px; font-size: 16px; line-height: 1.6; color: #333333;">
                    <p style="margin: 0 0 20px;">Bonjour ${consultantName},</p>
                    <p style="margin: 0 0 20px;">Nous vous informons que l'échange a été confirmé avec les détails suivants :</p>
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 5px; font-weight: bold; border-bottom: 1px solid #E5E7EB;">Jour :</td>
                        <td style="padding: 5px; border-bottom: 1px solid #E5E7EB;">${slot.selectedTimeSlot.day}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px; font-weight: bold; border-bottom: 1px solid #E5E7EB;">Date :</td>
                        <td style="padding: 5px; border-bottom: 1px solid #E5E7EB;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px; font-weight: bold; border-bottom: 1px solid #E5E7EB;">Heure de début :</td>
                        <td style="padding: 5px; border-bottom: 1px solid #E5E7EB;">${slot.selectedTimeSlot.startTime}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px; font-weight: bold; border-bottom: 1px solid #E5E7EB;">Heure de fin :</td>
                        <td style="padding: 5px; border-bottom: 1px solid #E5E7EB;">${slot.selectedTimeSlot.finishTime}</td>
                      </tr>
                    </table>
                    <p style="margin: 20px 0 0;">Vous recevrez bientôt une invitation sur Google Meet.</p>
                    <p style="margin: 20px 0 0;">Cordialement,<br>L'équipe Datamed Connect</p>
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
      console.log("Step 16: Email content prepared for:", consultantEmail);
      await sendEmail(consultantEmail, "Echange Confirmé", htmlContent);
      console.log("Step 17: Confirmation email sent to consultant");
    } catch (emailError) {
      console.error("Step 18: Error sending confirmation email:", emailError);
    }

    console.log("Step 19: Sending response with updated slot...");
    res.json(slot);
    console.log("Step 20: Response sent successfully");
  } catch (error) {
    console.error("Step 21: Error during slot update:", error);
    res.status(400).json({ message: error.message });
  }
};




const deleteSlotAdmin = async (req, res) => {
  try {
    const slot = await Slots.findByIdAndDelete(req.params.id);
    if (!slot) {
      return res.status(404).json({ message: "Créneau non trouvé" });
    }

    res.json({ message: "Créneau supprimé" });
  } catch (error) {
    console.error("Erreur lors de la suppression du créneau :", error);
    res.status(500).json({ message: error.message });
  }
};

const updateSlotStatus = async (req, res) => {
  try {
    const slot = await Slots.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ message: "Créneau non trouvé" });
    }
    const oldStatus = slot.status;
    slot.status = req.body.status;
    await slot.save();

    res.json(slot);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut du créneau :", error);
    res.status(400).json({ message: error.message });
  }
};

const getAllConsultantsSlotsById = async (req, res) => {
  try {
    const userId = req.params.id;

    // Vérifier que l'ID de l'utilisateur requis correspond au client authentifié
    if (userId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Interdit : Vous ne pouvez accéder qu'à vos propres données" });
    }

    // Récupérer tous les créneaux créés par cet utilisateur
    const slots = await Slots.find({ createdBy: userId })
      .populate({
        path: "consultants",
        populate: {
          path: "Profile",
          select: "Name Poste",
        },
      })
      .lean();

    if (!slots || slots.length === 0) {
      return res.status(404).json({ message: "Aucun créneau trouvé pour cet utilisateur" });
    }

    // Transformer les créneaux pour inclure les champs nécessaires
    const transformedSlots = slots.map((slot) => ({
      _id: slot._id,
      exchangeNumber: slot.exchangeNumber,
      status: slot.status,
      timeSlots: slot.timeSlots,
      consultants: slot.consultants
        ? {
            _id: slot.consultants._id,
            TjmOrSalary: slot.consultants.TjmOrSalary,
            Age: slot.consultants.Age,
            Location: slot.consultants.Location,
            Email: slot.consultants.Email,
            Profile: slot.consultants.Profile
              ? {
                  Name: slot.consultants.Profile.Name,
                  Poste: slot.consultants.Profile.Poste,
                  Initials: getInitials(slot.consultants.Profile.Name),
                }
              : null,
          }
        : null,
      selectedTimeSlot: slot.selectedTimeSlot,
      createdAt: slot.createdAt, // Ajouter la date de création
      __v: slot.__v,
    }));

    res.status(200).json(transformedSlots);
  } catch (error) {
    console.error("Erreur lors de la récupération des créneaux :", error);
    res.status(500).json({ message: "Erreur du serveur" });
  }
};

module.exports = {
  createSlotAdmin,
  getAllSlotsAdmin,
  getSlotAdmin,
  updateSlotDetails,
  deleteSlotAdmin,
  updateSlotStatus,
  getAllConsultantsSlotsById,
  getSlotsByClient,
};
