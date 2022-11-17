require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");

const User = require("./model/user");
const Ground = require("./model/ground");
const auth = require("./middleware/auth");

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(multer().none());

app.post("/register", async (req, res) => {
  try {
    // Get user input
    const { first_name, last_name, email, password } = req.body;
    // Validate user input
    if (!(email && password && first_name && last_name)) {
      res.status(400).send("All input is required");
    }

    // check if user already exist
    // Validate if user exist in our database
    const oldUser = await User.findOne({ email });

    if (oldUser) {
      return res.status(409).send("User Already Exist. Please Login");
    }

    //Encrypt user password
    encryptedPassword = await bcrypt.hash(password, 10);

    // Create user in our database
    const user = await User.create({
      first_name,
      last_name,
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

app.post("/grounds/create", auth, async (req, res) => {
  try {
    const { gName, description, rate } = req.body;
    if (!(gName && description && rate)) {
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
    });
    res.status(201).json(ground);
  } catch (err) {
    console.log(err);
    // res.status(500).send("Internal server error");
  }
});

app.post("/grounds/update", auth, async (req, res) => {
  try {
    const { _id, gName, description, rate } = req.body;

    const oldGround = await Ground.findOneAndUpdate(
      { _id },
      { gName, description, rate }
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
