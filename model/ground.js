const mongoose = require("mongoose");

const groundSchema = new mongoose.Schema({
  gName: { type: String, default: null },
  description: { type: String, default: null },
  rate: { type: Number, default: null },
});

module.exports = mongoose.model("ground", groundSchema);
