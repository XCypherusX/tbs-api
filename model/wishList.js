const mongoose = require("mongoose");

const wishListSchema = new mongoose.Schema({
    user_id: { type: 'ObjectId', default: null, ref: "user" },
    ground_id: { type: 'ObjectId', default: null, ref: "ground" },
    reservation_id: { type: 'ObjectId', default: null, ref: "reservation"},
    isAvailable: { type: Boolean, default: false },
})

module.exports = mongoose.model( "wishlist", wishListSchema )