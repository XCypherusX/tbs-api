const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  full_name: { type: String, default: null },
  nid: { type: String, default: null },
  dob: { type: Date, default: null },
  gender: { type: String, default: null },
  contact: { type: Number, default: null },
  email: { type: String, unique: true },
  password: { type: String },
  role: { type: String },
  token: { type: String },
});

module.exports = mongoose.model("user", userSchema);
