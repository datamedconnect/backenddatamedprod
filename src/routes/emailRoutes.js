const express = require("express");
const router = express.Router();

const formController = require("../controllers/formController");

router.post("/contact", formController.handleContactForm);
router.post("/demo", formController.handleDemoForm);

module.exports = router;
