const mongoose = require("mongoose");

const ContactSchema = mongoose.Schema({
  name: String,
  userId: [{ type: mongoose.Types.ObjectId, ref: "User" }],
  email: {
    type: String,
    unique: true,
    required: true,
  },
  description: String,
  category: String,
  isAdmin: Boolean
});

const Contact = mongoose.model("Contact", ContactSchema);

module.exports = Contact;
