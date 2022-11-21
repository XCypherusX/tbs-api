const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({
  user_id: { type: 'ObjectId', default: null, ref: "user" },
  ground_id: { type: 'ObjectId', default: null, ref: "ground" },
  timeSlot_id: { type: 'ObjectId', default: null, ref: "timeSlots" },
//   date_time: { type: Date, default: null},
  isActive: { type: Boolean, default: null },
});

module.exports = mongoose.model("reservation", reservationSchema);
