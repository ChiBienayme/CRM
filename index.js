const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();

// Models
const User = require("./models/userModel");
const Contact = require("./models/contactModel");

// http://www.unit-conversion.info/texttools/random-string-generator/ : 30 characters
const secret = "5uzhJWUDUDHpTCE5Wbl3uv5Svdo3cT";

// Middlewares
app.use(express.json());
app.use(cookieParser());

// Connexion à MongoDB
mongoose
  .connect(
    "mongodb+srv://chibienayme:UCPC3bbpkpuoROqt@cluster0.pg9q2.mongodb.net/CRM?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
    }
  )
  .then(() => {
    console.log("Connected to MongoDB");
  });

// !  Routes
// TODO Homepage
app.get("/", (_req, res) => {
  res.send("CRM page");
});

// TODO Register: email, password
app.post("/register", async (req, res) => {
  // 1 - Hasher le mot de passe
  const hashedPassword = await bcrypt.hash(req.body.password, 12);

  // 2 - Créer un utilisateur
  try {
    await User.create({
      email: req.body.email,
      password: hashedPassword,
    });
  } catch (err) {
    return res.status(400).json({
      message: "This account already exists",
    });
  }

  res.status(201).json({
    message: `User ${req.body.email} created`,
  });
});

// TODO Login: email + password
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // 1 - Vérifier si le compte associé à l'email existe
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({
      message: "Invalid email or password",
    });
  }

  // 2 - Comparer le mot de passe au hash qui est dans la DB
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(400).json({
      message: "Invalid email or password",
    });
  }

  // 3 - Générer un token
  const token = jwt.sign({ id: user._id }, secret);

  // 4 - On met le token dans un cookie
  res.cookie("jwt", token, { httpOnly: true, secure: false });

  // 5 - Envoyer le cookie au client
  res.json({
    message: "You are signed in",
  });
});

// TODO Find info of an user by userId
app.get("/users/:userId", async (req, res) => {
  const user = await User.findById(req.params.userId);
  res.json(user);
});

// TODO Add contact by userId: name, email, description, category
app.post("/users/:userId/contact", async (req, res) => {
  const contact = await Contact.create(req.body);
  await User.findByIdAndUpdate(req.params.userId, {
    $push: { contact: contact._id },
  });

  res.status(201).send("Contact is added");
});

// TODO Contacts: name, email, description, category
app.get("/contacts", async (req, res) => {
  // 1 - Vérifier le token qui est dans le cookie
  let data;
  let contacts;
  try {
    data = jwt.verify(req.cookies.jwt, secret);
    contacts = await Contact.find();
  } catch (err) {
    return res.status(401).json({
      message: "Your token is not valid",
    });
  }

  // L'utilisateur est authentifié/autorisé
  res.json({
    message: "Your token is valid",
    data,
    contacts,
  });
});

// Start server
app.listen(8000, () => {
  console.log("Listening in the port 8000");
});
