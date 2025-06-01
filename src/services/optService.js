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
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code de Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #ffffff; color: #000000; text-align: center; border: 1px solid #555555; border-radius: 15px;">
    <div style="margin-bottom: 20px;">
        <p style="font-size: 18px; font-weight: bold; color: #000000;">DATAMED CONNECT</p>
    </div>
    <div style="font-size: 16px; line-height: 1.5; margin-bottom: 20px; color: #000000;">
        Merci de déposer votre candidature chez <strong>DATAMED CONSULTING</strong> ! Afin de sécuriser votre compte et de finaliser votre inscription, veuillez saisir le code de confirmation ci-dessous :
    </div>
    <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px; margin: 20px 0; color: #000000;">
        ${otp}
    </div>
    <div style="font-size: 16px; line-height: 1.5; margin-bottom: 20px; color: #000000;">
        Ce code est valide pendant 15 minutes. Si vous n’avez pas initié cette demande, veuillez ignorer cet e-mail.
    </div>
    <div style="font-size: 12px; color: #666666; margin-top: 20px; border-top: 1px solid #e0e0e0; padding-top: 10px;">
        <div>
            <span style="font-size: 14px; color: #0066cc; text-decoration: underline; margin-right: 10px;">Mentions légales</span>
            <span style="font-size: 14px; color: #0066cc; text-decoration: underline; margin-right: 10px;">Politique de cookies</span>
            <span style="font-size: 14px; color: #0066cc; text-decoration: underline;">Politique de confidentialité</span>
        </div>
        <div style="font-size: 12px; color: #666666; margin-top: 5px;">
            © 2025 - Datamed Connect - Site conçu par FARES SAFER
        </div>
    </div>
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
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code de Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #ffffff; color: #000000; text-align: center; border: 1px solid #555555; border-radius: 15px;">
    <div style="margin-bottom: 20px;">
        <p style="font-size: 18px; font-weight: bold; color: #000000;">DATAMED CONNECT</p>
    </div>
    <div style="font-size: 16px; line-height: 1.5; margin-bottom: 20px; color: #000000;">
        Merci de déposer votre candidature chez <strong>DATAMED CONSULTING</strong> ! Afin de sécuriser votre compte et de finaliser votre inscription, veuillez saisir le code de confirmation ci-dessous :
    </div>
    <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px; margin: 20px 0; color: #000000;">
        ${otp}
    </div>
    <div style="font-size: 16px; line-height: 1.5; margin-bottom: 20px; color: #000000;">
        Ce code est valide pendant 15 minutes. Si vous n’avez pas initié cette demande, veuillez ignorer cet e-mail.
    </div>
    <div style="font-size: 12px; color: #666666; margin-top: 20px; border-top: 1px solid #e0e0e0; padding-top: 10px;">
        <div>
            <span style="font-size: 14px; color: #0066cc; text-decoration: underline; margin-right: 10px;">Mentions légales</span>
            <span style="font-size: 14px; color: #0066cc; text-decoration: underline; margin-right: 10px;">Politique de cookies</span>
            <span style="font-size: 14px; color: #0066cc; text-decoration: underline;">Politique de confidentialité</span>
        </div>
        <div style="font-size: 12px; color: #666666; margin-top: 5px;">
            © 2025 - Datamed Connect - Site conçu par FARES SAFER
        </div>
    </div>
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
