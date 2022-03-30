const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
  name: String,
  email: {
    type: String, 
    unique: true
  },
  password: String,
  description: [{ type: mongoose.Types.ObjectId, ref: "Description" }],
  category: [{ type: mongoose.Types.ObjectId, ref: "Category" }],

  });

const User = mongoose.model("User", UserSchema);

module.exports = User;
