const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { sendEmail } = require("../services/emailService");

const signup = async (req, res) => {
  const { email, password, role, name, companyName } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "L'email existe déjà" });
    }

    if (role === "client" && !companyName) {
      return res.status(400).json({
        message: "Le nom de l'entreprise est requis pour les clients",
      });
    }
    if (role === "admin" && !name) {
      return res
        .status(400)
        .json({ message: "Le nom est requis pour les administrateurs" });
    }

    const user = new User({ email, password, role, name, companyName });
    await user.save();

    const verificationToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    const loginUrl = `https://datamedconnect.com/verify?token=${verificationToken}`;

    const html = `
      <!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenue sur Datamed Connect</title>
  <style>
    /* Reset styles for email clients */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; font-family: 'Helvetica Neue', Arial, sans-serif; }
    a { text-decoration: none; }
    /* Custom styles */
    .button { display: inline-block; padding: 12px 24px; background-color: #173A6D; color: #FFFFFF !important; border-radius: 5px; font-weight: bold; text-align: center; }
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
              <img src="https://media-hosting.imagekit.io/e0ef119c9b7f46a4/logo.png?Expires=1838884151&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=SD~YyZD-QpQkqWVeTCjFR8Hj9hko~Xq0gA9IGxR1WcrIJdFltcgAzXApdh4geqfzeb89XRh~3ZrqbYxPqmDR6XgOlWzVDpPBov8PwZuuxFDX7qFBaUpU0KfMfRX-5Spr4WGL9L3Q0Wb94k8d9jJJIv3fGh0Djm2r6MqyVrG6rEt8ffsLsuAk8Hd3vuqO5jUOEzcLo-GSTXp2y0QbeYJS5hNxUZu-rcjeJrzIyZPSJfE~frdChIdqGhLaSfJa8M0Q0DcuK4WZPbmJ0ZdsySo7-mVeoaeH4aUrNoqSKuPyu9I~2CIUn9-uu0hHCjvvZ650YQ7Dt8p8CBPCR3psIVUwqA__" alt="Datamed Connect Logo" style="max-width: 150px; width: 100%; height: auto;" />
            </td>
          </tr>
          <!-- Title -->
          <tr>
            <td style="text-align: center; padding: 10px 20px;">
              <h1 style="font-size: 24px; font-weight: bold; color: #173A6D; margin: 0;">Bienvenue sur Datamed Connect !</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 20px 30px; font-size: 16px; line-height: 1.6; color: #333333;">
              <p style="margin: 0 0 20px;">Merci pour votre inscription à Datamed Connect. Pour finaliser la création de votre compte, veuillez vérifier votre adresse e-mail en cliquant sur le bouton ci-dessous :</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${loginUrl}"" class="button">Vérifier et se connecter</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #F9FAFB; border-top: 1px solid #E5E7EB; text-align: center; font-size: 12px; color: #666666;">
              <p style="margin: 0 0 10px;">Suivez-nous sur :</p>
              <p style="margin: 0 0 20px;">
                <a href="#" style="margin: 0 5px;"><img src="https://via.placeholder.com/24x24?text=FB" alt="Facebook" style="width: 24px; height: 24px;" /></a>
                <a href="#" style="margin: 0 5px;"><img src="https://via.placeholder.com/24x24?text=TW" alt="Twitter" style="width: 24px; height: 24px;" /></a>
                <a href="#" style="margin: 0 5px;"><img src="https://via.placeholder.com/24x24?text=LI" alt="LinkedIn" style="width: 24px; height: 24px;" /></a>
              </p>
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

    await sendEmail(email, "Bienvenue sur Datamed Connect", html);
    res.status(201).json({
      message: "Utilisateur créé avec succès. Veuillez vérifier votre email.",
    });
  } catch (error) {
    console.error("Erreur d'inscription:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Erreur du serveur" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt:", { email, password });
  try {
    const user = await User.findOne({ email });
    if (!user || user.status !== "Activé") {
      return res.status(401).json({ message: "Adresse e-mail non trouvée" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    req.user = { id: user._id };

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "8h",
    });
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60 * 1000,
    });
    res.json({ token });
  } catch (error) {
    console.error("Erreur de connexion:", error);
    res.status(500).json({ message: "Erreur du serveur" });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "role email companyName name"
    );
    console.log("User details fetched:", user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      id: user._id,
      role: user.role,
      email: user.email,
      companyName: user.companyName,
      name: user.name,
      phonenumber: user.phoneNumber,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Server error" });
  }
};
const updateUserDetails = async (req, res) => {
  try {
    console.log("Update user details request:", req.body);
    const { email, phonenumber, name, companyName } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (email) user.email = email;
    if (phonenumber) user.phoneNumber = phonenumber;
    if (name) user.name = name;
    if (companyName) user.companyName = companyName;

    await user.save();

    res.json({
      message: "User details updated successfully",
      user: {
        id: user._id,
        role: user.role,
        email: user.email,
        companyName: user.companyName,
        name: user.name,
        phonenumber: user.phoneNumber,
      },
    });
  } catch (error) {
    console.error("Error updating user details:", error);
    res.status(500).json({ message: "Server error" });
  }
};
const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    console.log("Reset password request:", { email, newPassword });
    if (!email || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email and new password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = newPassword; // Set the plain password here
    await user.save(); // Pre-save hook will hash it once

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error(`Error resetting password: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current and new passwords are required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Set plain text password; pre-save hook will hash it
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Server error" });
  }
};
module.exports = {
  signup,
  login,
  getUserDetails,
  resetPassword,
  updateUserDetails,
  updatePassword,
};
