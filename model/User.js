const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
   name: {
      type: String,
      required: true,
   },
   highscore: {
      type: Number,
      required: true,
   }
});

// collection name will be users
const User = mongoose.model("User", userSchema);
module.exports = User;
