const express = require("express");
const router = express.Router();
const UserController = require("../controller/userController");

// Create user
router.post("/create", UserController.createUser);

// Optional: Get all users
router.get("/all", UserController.getAllUsers);

router.post("/login", UserController.login);

module.exports = router;
