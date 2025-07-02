const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { sendEmail } = require("../services/emailService");

// In-memory store for verification codes (use Redis or similar in production)
const verificationCodes = new Map(); // { email: { code: string, expires: number, attempts: number } }
const RESEND_LIMIT = 3; // Max resend attempts
const CODE_EXPIRY = 5 * 60 * 1000; // 5 minutes expiry

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
      return res.status(400).json({ message: "Le nom est requis pour les administrateurs" });
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
          body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; }
          .button { display: inline-block; padding: 12px 24px; background-color: #173A6D; color: #FFFFFF !important; border-radius: 5px; font-weight: bold; }
          .container { max-width: 600px; background-color: #FFFFFF; border-radius: 10px; }
        </style>
      </head>
      <body style="background-color: #F4F6F9;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" style="padding: 20px;">
              <table class="container">
                <tr>
                  <td style="text-align: center; padding: 30px;">
                    <img src="https://media-hosting.imagekit.io/e0ef119c9b7f46a4/logo.png" alt="Logo" style="max-width: 150px;" />
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px; font-size: 16px;">
                    <h1 style="color: #173A6D;">Bienvenue sur Datamed Connect !</h1>
                    <p>Veuillez vérifier votre adresse e-mail en cliquant ci-dessous :</p>
                    <p style="text-align: center;">
                      <a href="${loginUrl}" class="button">Vérifier et se connecter</a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px; background-color: #F9FAFB; font-size: 12px; text-align: center;">
                    <p>© 2025 - Datamed Connect</p>
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
    res.status(500).json({ message: "Erreur du serveur" });
  }
};
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.status !== "Activé") {
      return res.status(401).json({ message: "Adresse e-mail non trouvée ou compte non activé" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    // Generate a 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + CODE_EXPIRY;

    // Store the code in memory
    verificationCodes.set(email, { code, expires, attempts: 0 });

    // Send email with verification code
    const html = `
      <!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nouveau code de vérification</title>
  <style>
    /* Reset styles for email clients */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #F4F6F9; color: #333333; }
    a { text-decoration: none; }
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
    }
  </style>
</head>
<body>
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
              Votre code de vérification
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; font-size: 16px; line-height: 1.6; color: #333333; text-align: center;">
              <p style="margin: 0 0 10px;">Votre nouveau code est :</p>
              <p style="font-size: 24px; font-weight: bold; color: #173A6D; margin: 0 0 10px;">${code}</p>
              <p style="margin: 0;">Ce code expire dans 5 minutes.</p>
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

    await sendEmail(email, "Votre code de vérification", html);
    res.json({ message: "Code de vérification envoyé", email });
  } catch (error) {
    console.error("Erreur de connexion:", error);
    res.status(500).json({ message: "Erreur du serveur" });
  }
};

const verifyCode = async (req, res) => {
  const { email, code } = req.body;
  try {
    const storedData = verificationCodes.get(email);
    if (!storedData) {
      return res.status(400).json({ message: "Aucun code trouvé pour cet email" });
    }
    if (storedData.expires < Date.now()) {
      verificationCodes.delete(email);
      return res.status(400).json({ message: "Code expiré" });
    }
    if (storedData.code !== code) {
      return res.status(400).json({ message: "Code incorrect" });
    }

    // Code is valid, issue JWT
    const user = await User.findOne({ email });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "8h",
    });

    // Clean up
    verificationCodes.delete(email);

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60 * 1000,
    });
    res.json({
      token,
      user: { id: user._id, role: user.role, email: user.email },
    });
  } catch (error) {
    console.error("Erreur de vérification:", error);
    res.status(500).json({ message: "Erreur du serveur" });
  }
};

const resendCode = async (req, res) => {
  const { email } = req.body;
  try {
    const storedData = verificationCodes.get(email);
    if (!storedData) {
      return res.status(400).json({ message: "Aucune session de connexion active" });
    }
    if (storedData.attempts >= RESEND_LIMIT) {
      verificationCodes.delete(email);
      return res.status(429).json({ message: "Limite de renvoi atteinte" });
    }

    // Generate new code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + CODE_EXPIRY;
    verificationCodes.set(email, {
      code,
      expires,
      attempts: storedData.attempts + 1,
    });

    // Send email
    const html = `
      <!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nouveau code de vérification</title>
  <style>
    /* Reset styles for email clients */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #F4F6F9; color: #333333; }
    a { text-decoration: none; }
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
    }
  </style>
</head>
<body>
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
              Votre code de vérification
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; font-size: 16px; line-height: 1.6; color: #333333; text-align: center;">
              <p style="margin: 0 0 10px;">Votre nouveau code est :</p>
              <p style="font-size: 24px; font-weight: bold; color: #173A6D; margin: 0 0 10px;">${code}</p>
              <p style="margin: 0;">Ce code expire dans 5 minutes.</p>
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

    await sendEmail(email, "Nouveau code de vérification", html);
    res.json({ message: "Nouveau code envoyé" });
  } catch (error) {
    console.error("Erreur de renvoi:", error);
    res.status(500).json({ message: "Erreur du serveur" });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "role email companyName name"
    );
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
    if (!email || !newPassword) {
      return res.status(400).json({ message: "Email and new password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = newPassword;
    await user.save();

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
      return res.status(400).json({ message: "Current and new passwords are required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

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
  verifyCode,
  resendCode,
  getUserDetails,
  resetPassword,
  updateUserDetails,
  updatePassword,
};