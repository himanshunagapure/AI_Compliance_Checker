const User = require("../models/Users");

class UserController {
  // POST /api/users/create
  static async createUser(req, res) {
    try {
      const { user_name, password, role, avatar_url } = req.body;

      // Check if user already exists
      const existing = await User.findOne({ user_name });
      if (existing) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Create and save new user
      const newUser = new User({ user_name, password, role, avatar_url });
      await newUser.save();

      res
        .status(201)
        .json({ message: "User created successfully", user: newUser });
    } catch (err) {
      console.error("Error creating user:", err);
      res.status(500).json({ error: "Failed to create user" });
    }
  }

  // Optional: GET all users
  static async getAllUsers(req, res) {
    try {
      const users = await User.find();
      res.status(200).json(users);
    } catch (err) {
      console.error("Error fetching users:", err);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  }

  static async login(req, res) {
    try {
      const { user_name, password } = req.body;
      console.log("Login attempt:", user_name, password);
      const user = await User.findOne({ user_name });
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      res.status(200).json({
        message: "Login successful",
        user: {
          user_name: user.user_name,
          role: user.role,
          avatar_url: user.avatar_url,
        },
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Login failed" });
    }
  }
}

module.exports = UserController;
