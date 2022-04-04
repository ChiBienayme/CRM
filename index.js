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

// dotenv
require("dotenv").config();

const { PORT, MONGODB_URI, API_KEY } = process.env;

// Connexion à MongoDB
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  });

// !  Routes
// TODO Homepage
app.get("/", (req, res) => {
  req.setHeader("Content-Type", "text");
  req.send("<h1>Welcome</h1>");
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

  // 5 - Envoyer le cookie au name
  res.json({
    message: "You are signed in",
  });
});

// TODO Find info of an user by userId
app.get("/users/:userId", async (req, res) => {
  const user = await User.findById(req.params.userId);
  res.json(user);
});

// TODO Add a contact by userId: name, email, description, category
app.post("/users/:userId/contact", async (req, res) => {
  let data;
  let contact;
  let contactRelated;
  try {
    data = jwt.verify(req.cookies.jwt, secret);
    contactRelated = await User.findById(req.params.userId);
    contact = await Contact.create({
      userId: contactRelated._id,
      name: req.body.name,
      email: req.body.email,
      description: req.body.description,
      category: req.body.category,
      isAdmin: req.body.isAdmin,
    });
    res.json({
      message: `Infos of ${req.body.name} are added`,
      data,
      contact,
    });
  } catch (err) {
    return res.status(401).json({
      message: "Your token is not valid",
    });
  }
});

// TODO Get the list of all contacts
app.get("/contacts", async (req, res) => {
  // 1 - Vérifier le token qui est dans le cookie
  let data;
  let contacts;
  let nb;
  try {
    data = jwt.verify(req.cookies.jwt, secret);
    contacts = await Contact.find();
    nb = await Contact.count();
  } catch (err) {
    return res.status(401).json({
      message: "Your token is not valid",
    });
  }

  // L'utilisateur est authentifié/autorisé
  res.json({
    message: `Your token is valid, total contacts are ${nb}`,
    data,
    contacts,
  });
});

// TODO Modifier un contact by contactId: with PUT
app.put("/contacts/:contactId", async (req, res) => {
  await Contact.findByIdAndUpdate(req.params.contactId, {
    description: req.body.description,
    category: req.body.category,
    isAdmin: req.body.isAdmin,
  });

  res.json({
    message: `Contact is modified`,
  });
});

// TODO Delete a contact
app.delete("/delete/:contactId", async (req, res) => {
  let contact;
  let contactId = req.params.contactId;

  try {
    contactId = await Contact.remove({
      _id: contactId,
    });
    contact = await Contact.find();
  } catch (err) {
    return res.status(401).json({
      message: "Error",
    });
  }

  res.json({
    message: `Contact is deleted`,
    contact,
  });
});

// TODO Filter
app.get("/contacts/filter", async (req, res) => {
  let filteredContact;
  try {
    data = jwt.verify(req.cookies.jwt, secret);
    filteredContact = await Contact.find(req.query);

    res.json({
      message: "User is filtered",
      filteredContact,
    });
  } catch (err) {
    return res.status(401).json({
      message: "Error",
    });
  }
});

// TODO Logout
app.get("/logout", (req, res) => {
  try {
    data = jwt.verify(req.cookies.jwt, secret);
    res.clearCookie("jwt").status(200).json({
      message: "You have successfully logged out!",
    });
    // res.redirect("/");
  } catch (err) {
    return res.status(401).json({
      message: "Your token is not valid",
    });
  }
});

// TODO Admin Delete a contact by contactId
app.delete("/isAdmin/delete/:userId", async (req, res) => {
  if ((req.params.isAdmin = true)) {
    try {
      const user = await User.findById(req.params.userId);
      await Contact.remove({ userId: user._id });
      await User.findByIdAndDelete(req.params.userId);
      res.status(200).json({
        message: "User has been deleted",
      });
    } catch (err) {
      console.log(err);
      res.status(400).json({
        message: "Error",
      });
    }
  } else {
    res.status(400).json({
      message: "You are not admin, you can not delete an user",
    });
  }
});

// TODO Message error for all pages
app.get("*", (_req, res) => {
  res.status(404).send("Not found");
});

// TODO Start server
app.listen(PORT, () => {
  console.log("Listening in the port 8000");
});
