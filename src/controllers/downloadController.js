const ejs = require("ejs");
const path = require("path");
const puppeteer = require("puppeteer");
const Consultant = require("../models/Consultant");
const handlebars = require("handlebars");
const fs = require("fs");

// Function to get initials from a full name
const getInitials = (name) => {
  const nameParts = name.split(" ").filter((part) => part.length > 0);
  const initials = nameParts
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  return initials;
};

const downloadConsultantCV = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch consultant data
    const consultant = await Consultant.findById(id).populate("Profile").lean();
    if (!consultant) {
      return res.status(404).json({ message: "Consultant not found" });
    }

    // Compute initials
    const initials = getInitials(consultant.Profile.Name);

    // Load and compile templates
    const firstPageTemplate = fs.readFileSync(
      path.join(__dirname, "../templates/firstPage.hbs"),
      "utf8"
    );
    const experiencePageTemplate = fs.readFileSync(
      path.join(__dirname, "../templates/experiencePage.hbs"),
      "utf8"
    );
    const compileFirstPage = handlebars.compile(firstPageTemplate);
    const compileExperiencePage = handlebars.compile(experiencePageTemplate);

    // Register partials
    handlebars.registerPartial(
      "header",
      fs.readFileSync(path.join(__dirname, "../templates/header.hbs"), "utf8")
    );
    handlebars.registerPartial(
      "footer",
      fs.readFileSync(path.join(__dirname, "../templates/footer.hbs"), "utf8")
    );

    // Register helper for calculating top position
    handlebars.registerHelper("calculateTop", function (index) {
      return index === 0 ? 224 : 608;
    });

    // Prepare data for first page
    const firstPageData = {
      name: initials,
      poste: consultant.Profile.Poste.join(", "),
      AnnéeExperience: consultant.Profile.AnnéeExperience,
      langues: consultant.Profile.Langue,
      certifications: consultant.Profile.Certifications,
      formations: consultant.Profile.Formation,
      skills: consultant.Profile.Skills,
    };
    const firstPageHtml = compileFirstPage(firstPageData);

    // Group experiences based on Réalisation length
    const experiences = consultant.Profile.ExperienceProfessionnelle || [];
    const experienceGroups = [];
    let tempGroup = [];

    experiences.forEach((exp) => {
      const realisationLines = exp.Réalisation.length;
      if (realisationLines > 4) {
        if (tempGroup.length > 0) {
          experienceGroups.push(tempGroup);
          tempGroup = [];
        }
        experienceGroups.push([exp]);
      } else {
        tempGroup.push(exp);
        if (tempGroup.length === 2) {
          experienceGroups.push(tempGroup);
          tempGroup = [];
        }
      }
    });

    // Add any remaining experiences in tempGroup
    if (tempGroup.length > 0) {
      experienceGroups.push(tempGroup);
    }

    // Render experience pages with limited Réalisation items
    const experiencePagesHtml = experienceGroups
      .map((group) => {
        const limitedGroup = group.map((exp) => ({
          ...exp,
          Réalisation: exp.Réalisation.slice(0, 14),
        }));
        return `
        <div class="page" style="width: 794px; height: 1122px; position: relative; background: white; overflow: hidden;">
          ${compileExperiencePage({ experiences: limitedGroup })}
        </div>
      `;
      })
      .join("");

    // Combine all HTML
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>CV de ${initials}</title>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&display=swap" rel="stylesheet" />
        <style>
          .page {
            page-break-after: always;
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5; color: #000000;">
        ${firstPageHtml}
        ${experiencePagesHtml}
      </body>
      </html>
    `;

    // Generate PDF with Puppeteer
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1122 });
    await page.setContent(fullHtml, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
    });
    await browser.close();

    // Get current date and time
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-based
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const formattedDateTime = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
    const filename = `CV_${initials}_${formattedDateTime}.pdf`;

    // Send PDF response
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


const getConsultantById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format (MongoDB ObjectId)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid consultant ID format" });
    }

    // Find consultant by ID and populate ProfileConsultant
    const consultant = await Consultant.findById(id).populate("Profile").lean();

    if (!consultant) {
      return res.status(404).json({ message: "Consultant not found" });
    }

    // Return the consultant data with populated profile
    res.status(200).json({
      message: "Consultant retrieved successfully",
      data: consultant,
    });
  } catch (error) {
    console.error("Error fetching consultant:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = { downloadConsultantCV, getConsultantById };
