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
      return res
        .status(400)
        .json({ message: "Le nom de l'entreprise est requis pour les clients" });
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
    const loginUrl = `https://datamedconnect.onrender.com/verify?token=${verificationToken}`;

    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Bienvenue sur Datamed Connect</title>
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
                    Bienvenue sur Datamed Connect !
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px;">
                    <p>Merci pour votre inscription. Veuillez cliquer sur le lien ci-dessous pour vérifier votre compte et vous connecter :</p>
                    <p><a href="${loginUrl}" style="color: #0066cc; text-decoration: underline;">Vérifier et se connecter</a></p>
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
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Adresse e-mail non trouvée" });
    }
    if (user.status !== "Activé") {
      return res.status(401).json({ message: "Adresse e-mail non trouvée" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }
    const payload = { id: user._id, role: user.role, email: user.email };
    if (user.companyName) payload.companyName = user.companyName;
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "8h" });
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60 * 1000,
    });
    res.json({ token, role: user.role });
  } catch (error) {
    console.error("Erreur de connexion:", error);
    res.status(500).json({ message: "Erreur du serveur, veuillez réessayer plus tard" });
  }
};

module.exports = { signup, login };