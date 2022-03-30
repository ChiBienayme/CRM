const mongoose = require("mongoose");

const CategorySchema = mongoose.Schema({
  product: String,
});

const Category = mongoose.model("Category", CategorySchema);

module.exports = Category;
