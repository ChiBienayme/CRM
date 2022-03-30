const mongoose = require("mongoose");

const DescriptionSchema = mongoose.Schema({
	address: String
});

const Description = mongoose.model("Description", DescriptionSchema);

module.exports = Description;