const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    user_name: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "RM", "Manager"], //restrict roles
      default: "user",
    },
    avatar_url: {
      type: String,
      default: null,
    },
  },
  {
    versionKey: 0, // This will include `__v` by default
  }
);

module.exports = mongoose.model("users", userSchema);
