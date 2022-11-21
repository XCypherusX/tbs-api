const mongoose = require("mongoose");

const timeSlotsSchema = new mongoose.Schema({
  begTime: { type: Date, default: null },
  endTime: { type: Date, default: null },
});

module.exports = mongoose.model("timeSlots", timeSlotsSchema);