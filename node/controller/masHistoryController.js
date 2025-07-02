const MasHistory = require("../models/MasHistory");

class MasHistoryController {
  // POST /api/mas-history/save
  static async saveMasHistory(req, res) {
    try {
      const newEntry = new MasHistory(req.body);
      await newEntry.save();
      res.status(201).json({ message: "MAS history saved successfully" });
    } catch (error) {
      console.error("Error saving MAS history:", error);
      res.status(500).json({ error: "Failed to save MAS history" });
    }
  }

  // GET /api/mas-history/all
  static async getAllHistory(req, res) {
    try {
      const entries = await MasHistory.find().sort({ generated_at: -1 });
      res.status(200).json(entries);
    } catch (error) {
      console.error("Error fetching MAS history:", error);
      res.status(500).json({ error: "Failed to fetch MAS history" });
    }
  }

  // GET /api/mas-history/user/:user_name
  static async getHistoryByUser(req, res) {
    const { user_name } = req.params;
    // console.log(user_name);
    try {
      const entries = await MasHistory.find({ user_name }).sort({
        generated_at: -1,
      });
      // console.log(entries);
      res.status(200).json(entries);
    } catch (error) {
      console.error("Error fetching history for user:", error);
      res.status(500).json({ error: "Failed to fetch MAS history for user" });
    }
  }
}

module.exports = MasHistoryController;
