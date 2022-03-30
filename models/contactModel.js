const mongoose = require("mongoose");

const ContactSchema = mongoose.Schema({
  name: String,
  user: [{ type: mongoose.Types.ObjectId, ref: "User" }],
  description: String,
  category: Number,
  });

const Contact = mongoose.model("Contact", ContactSchema);

module.exports = Contact;
