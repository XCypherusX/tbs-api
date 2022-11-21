require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");

const User = require("./model/user");
const Ground = require("./model/ground");
const auth = require("./middleware/auth");
const cors = require('cors');
const Reservation = require("./model/reservation");
const TimeSlots = require("./model/timeSlots");
const Wishlist = require("./model/wishList");

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(multer().none());
app.use(cors({
  origin: '*'
}));

app.post("/register", async (req, res) => {
  try {
    // Get user input
    const { full_name, nid, dob, gender, contact, email, password, role } = req.body;
    // Validate user input
    if (!(email && password && full_name && nid && dob && gender && contact && role)) {
      res.status(400).send("All input is required");
    }

    // check if user already exist
    // Validate if user exist in our database
    const oldUser = await User.findOne({ email, nid });

    if (oldUser) {
      return res.status(409).send("User Already Exist. Please Login");
    }

    //Encrypt user password
    encryptedPassword = await bcrypt.hash(password, 10);

    // Create user in our database
    const user = await User.create({
      full_name,
      nid,
      dob,
      gender,
      contact,
      role,
      email: email.toLowerCase(), // sanitize: convert email to lowercase
      password: encryptedPassword,
    });

    // Create token
    const token = jwt.sign(
      { user_id: user._id, email },
      process.env.TOKEN_KEY,
      {
        expiresIn: "2h",
      }
    );
    // save user token
    user.token = token;

    // return new user
    res.status(201).json(user);
  } catch (err) {
    console.log(err);
  }
});

app.post("/login", async (req, res) => {
  try {
    // Get user input
    const { email, password } = req.body;

    // Validate user input
    if (!(email && password)) {
      res.status(400).send("All input is required");
    }
    // Validate if user exist in our database
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Create token
      const token = jwt.sign(
        { user_id: user._id, email },
        process.env.TOKEN_KEY,
        {
          expiresIn: "2h",
        }
      );

      // save user token
      user.token = token;

      // user
      res.status(200).json(user);
    }
    res.status(400).send("Invalid Credentials");
  } catch (err) {
    console.log(err);
  }
});

// Get user endpoint with token
app.get("/user", auth, async (req, res) => {
  try {
    const { tbs_token } = req.body;
    const decoded = jwt.verify(tbs_token, process.env.TOKEN_KEY);
    req.user = decoded;
    // get user from database
    const user = await User.findOne({ _id: req.user.user_id });
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
  }
});


app.post("/grounds/create", auth, async (req, res) => {
  try {
    const { gName, description, rate, active } = req.body;
    if (!(gName && description && rate && active)) {
      res.status(400).send("All input is required");
    }

    const oldGround = await Ground.findOne({ gName });
    if (oldGround) {
      res.status(400).send("Ground already exists");
    }
    const ground = await Ground.create({
      gName,
      description,
      rate,
      active,
    });
    res.status(201).json(ground);
  } catch (err) {
    console.log(err);
    // res.status(500).send("Internal server error");
  }
});

app.post("/grounds/update", auth, async (req, res) => {
  try {
    const { _id, gName, description, rate, active } = req.body;

    const oldGround = await Ground.updateOne(
      { _id },
      { gName, description, rate, active }
    );

    const newGround = await Ground.findOne({ _id });

    res.status(200).json(newGround);
  } catch (err) {
    console.log(err);
    // res.status(500).send("Internal server error");
  }
});



app.delete("/grounds/delete", auth, async (req, res) => {
  try {
    const { _id } = req.body;
    const ground = await Ground.findOneAndDelete({ _id });
    res.status(200).send("Ground deleted successfully");
  } catch (err) {
    console.log(err);
  }
});

app.get("/grounds", auth, async (req, res) => {
  try {
    const grounds = await Ground.find();
    res.status(200).json(grounds);
  } catch (err) {
    console.log(err);
    // res.status(500).send("Internal server error");
  }
});

app.get("/timeslots", auth, async (req, res) => {
  try {
    const timeslots = await TimeSlots.find();
    res.status(200).json(timeslots);
  } catch (err) {
    console.log(err);
    // res.status(500).send("Internal server error");
  }
});

app.post("/timeslots/create", auth, async (req, res) => {
  try {
    const { begTime, endTime } = req.body;
    if (!(begTime && endTime)) {
      res.status(400).send("All input is required");
    }

    const oldTimeSlot = await TimeSlots.findOne({ begTime });
    if (oldTimeSlot) {
      res.status(400).send("Slot already exists");
    }
    const timeSlot = await TimeSlots.create({
      begTime,
      endTime,
    });
    res.status(201).json(timeSlot);
  } catch (err) {
    console.log(err);
    // res.status(500).send("Internal server error");
  }
});

app.post("/reservation/create", auth, async (req, res) => {
  try {
    const { user_id, ground_id, timeSlot_id, isActive } = req.body;
    if (!(user_id && ground_id && timeSlot_id && isActive)) {
      res.status(400).send("All input is required");
    }
    const reservation = await Reservation.create({
      user_id,
      ground_id,
      timeSlot_id,
      isActive,
    });
    res.status(201).json(reservation);
  } catch (err) {
    console.log(err);
    // res.status(500).send("Internal server error");
  }
});

app.get("/reservation", auth, async (req, res) => {
  try {
    const reservations = await Reservation.find().populate('user_id').populate('ground_id');
    res.status(200).json(reservations);
  } catch (err) {
    console.log(err);
    // res.status(500).send("Internal server error");
  }
});

app.post("/reservation/update", auth, async (req, res) => {
  try {
    const { _id, user_id, ground_id, date_time, isActive } = req.body;
    const oldReservation = await Reservation.updateOne(
      { _id },
      { user_id, ground_id, date_time, isActive }
    );
    const newReservation = await Reservation.findOne({ _id });
    res.status(200).json(newReservation);
  } catch (err) {
    console.log(err);
    // res.status(500).send("Internal server error");
  }
});

app.post("/reservation/cancel", auth, async (req, res) => {
  try {
    const { _id, isActive } = req.body;
    const oldReservation = await Reservation.updateOne(
      { _id },
      { isActive }
    );
    const newReservation = await Reservation.findOne({ _id });
    res.status(200).json(newReservation);
  } catch (err) {
    console.log(err);
    // res.status(500).send("Internal server error");
  }
});


app.post("/reservation/byuser", auth, async (req, res) => {
  const { user_id, isActive } = req.body;
  try {
    const reservationsByUser = await Reservation.find({ user_id, isActive }).populate('user_id').populate('ground_id').populate('user_id').populate('timeSlot_id');
    res.status(200).json(reservationsByUser);
  } catch (err) {
    console.log(err);
    // res.status(500).send("Internal server error");
  }
});

app.post("/reservation/byground", auth, async (req, res) => {
  const { ground_id, isActive } = req.body;
  try {
    const reservationsByGround = await Reservation.find({ ground_id, isActive }).populate('user_id').populate('ground_id');
    res.status(200).json(reservationsByGround);
  } catch (err) {
    console.log(err);
    // res.status(500).send("Internal server error");
  }
});


app.post("/wishlist/create", auth, async (req, res) => {
  try {
    const { user_id, ground_id, reservation_id } = req.body;
    
    if (!(user_id && ground_id && reservation_id)) {
      res.status(400).send("All input is required");
    }
    const wishlist = await Wishlist.create({
      user_id,
      ground_id,
      reservation_id,
    });
    res.status(201).json(wishlist);
  } catch (err) {
    console.log(err);
    // res.status(500).send("Internal server error");
  }});

  app.post("/wishlist/availupdate", auth, async (req, res) => {
    try {
      const {user_id, reservation_id, ground_id,isAvailable } = req.body;
      const oldWishlist = await Wishlist.updateOne(
        { user_id, reservation_id, ground_id }, 
        { isAvailable }
      );
      const newWishlist = await Wishlist.findOne ({ user_id, reservation_id, ground_id })
      res.status(200).json(newWishlist);
    } catch (err) {
      console.log(err);
      // res.status(500).send("Internal server error");
    }});

    app.post("/wishlist/available", auth, async (req, res) => {
      const { user_id, isAvailable } = req.body;
      try {
        const wishlistByUser = await Wishlist.find({ user_id, isAvailable }).populate('user_id').populate('ground_id').populate('reservation_id');
        res.status(200).json(wishlistByUser);
      } catch (err) {
        console.log(err);
        // res.status(500).send("Internal server error");
      }
    });

// This should be the last route else any after it won't work
app.use("*", (req, res) => {
  res.status(404).json({
    success: "false",
    message: "Page not found",
    error: {
      statusCode: 404,
      message: "You reached a route that is not defined on this server",
    },
  });
});

module.exports = app;
