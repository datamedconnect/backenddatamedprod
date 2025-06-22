const nodemailer = require("nodemailer");
require("dotenv").config();

const otpStorage = new Map();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // e.g., "fares.s@consultingdatamed.com"
    pass: process.env.EMAIL_PASS, // e.g., App Password "fcpv rosv wnkf vvfz"
  },
});

// Function to generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Function to send OTP via email
const sendEmail = async (to, otp) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: to,
      subject: "Votre Code OTP",
      html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Code de Confirmation - Datamed Connect</title>
  <style>
    /* Reset styles for email clients */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; font-family: 'Helvetica Neue', Arial, sans-serif; }
    a { text-decoration: none; }
    /* Custom styles */
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
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
              <h1 style="font-size: 24px; font-weight: bold; color: #173A6D; margin: 0;">Code de Confirmation</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 20px 30px; font-size: 16px; line-height: 1.6; color: #333333;">
              <p style="margin: 0 0 20px;">Merci de déposer votre candidature chez <strong>DATAMED CONSULTING</strong> ! Afin de sécuriser votre compte et de finaliser votre inscription, veuillez saisir le code de confirmation ci-dessous :</p>
              <p style="font-size: 36px; font-weight: bold; letter-spacing: 10px; margin: 20px 0; text-align: center; color: #173A6D;">${otp}</p>
              <p style="margin: 20px 0 0;">Ce code est valide pendant 15 minutes. Si vous n’avez pas initié cette demande, veuillez ignorer cet e-mail.</p>
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
              <p style="margin: 0;">© 2025 - DATAMED Connect - Conçu par DatamedConsulting</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email: ", error);
    throw new Error("Failed to send OTP email");
  }
};

// Function to send OTP via email
const sendVerif = async (to, otp) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: to,
      subject: "Votre Code OTP",
      html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Code de Confirmation</title>
  <style>
    /* Reset styles for email clients */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; font-family: 'Helvetica Neue', Arial, sans-serif; }
    a { text-decoration: none; }
    /* Custom styles */
    .otp-code { display: inline-block; padding: 10px 20px; background-color: #F4F6F9; border-radius: 5px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #173A6D; }
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .otp-code { font-size: 24px; letter-spacing: 5px; }
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
              <h1 style="font-size: 24px; font-weight: bold; color: #173A6D; margin: 0;">Code de Confirmation</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 20px 30px; font-size: 16px; line-height: 1.6; color: #333333;">
              <p style="margin: 0 0 20px;">Merci de déposer votre candidature chez <strong>Datamed Consulting</strong> ! Afin de sécuriser votre compte et de finaliser votre inscription, veuillez saisir le code de confirmation ci-dessous :</p>
              <p style="text-align: center; margin: 30px 0;">
                <span class="otp-code">${otp}</span>
              </p>
              <p style="margin: 20px 0 0;">Ce code est valide pendant 15 minutes. Si vous n’avez pas initié cette demande, veuillez ignorer cet e-mail.</p>
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
</html>`,
    });
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email: ", error);
    throw new Error("Failed to send OTP email");
  }
};

const sendOTP = async (email) => {
  const otp = generateOTP();
  otpStorage.set(email, otp);
  console.log(`OTP for ${email}: ${otp}`);

  // Send OTP to email
  await sendEmail(email, otp);

  return { email, otp };
};

// Verify OTP function
const verifyOTP = async (email, otp) => {
  console.log("Verifying OTP for email:", email);
  const storedOTP = otpStorage.get(email);
  console.log("Stored OTP for email:", storedOTP);

  if (storedOTP && storedOTP === otp) {
    otpStorage.delete(email); // Clear OTP after successful verification
    console.log("OTP verified successfully");
    return true;
  }

  console.log("OTP verification failed");
  return false;
};

module.exports = { sendOTP, verifyOTP, sendVerif };
