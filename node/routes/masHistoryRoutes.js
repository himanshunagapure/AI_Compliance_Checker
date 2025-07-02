const express = require("express");
const router = express.Router();
const MasHistoryController = require("../controller/masHistoryController");

// Save MAS history
router.post("/save", MasHistoryController.saveMasHistory);

// Get all MAS history
router.get("/all", MasHistoryController.getAllHistory);

// Get MAS history by user_name
router.get("/user/:user_name", MasHistoryController.getHistoryByUser);

module.exports = router;
