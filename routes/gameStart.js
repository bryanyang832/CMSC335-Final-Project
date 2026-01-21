const express = require("express");
const router = express.Router();

const User = require("../model/User.js"); // Get the user schema
const Game = require("../game/Game.js");

router.get("/", (request, result) => {
    result.render("gameStart.ejs");
});

router.post("/", async (request, result) => {
    try {
      let {name} = request.body;

      // Check if the user with name has played before
      let user = await User.findOne({ name: name });
      let highscore = user ? user.highscore : 0;

      request.session.game = new Game();
      request.session.game.name = name;
      request.session.game.highscore = highscore;
      
      let variables = {
         name: request.session.game.name,
         round: request.session.game.round,
         score: request.session.game.score,
         playerOne: request.session.game.playerOne,
         playerTwo: request.session.game.playerTwo,
         highscore: request.session.game.highscore
      }
      result.render("gamePage.ejs", variables);

   } catch(err) {
      console.error(err);
   }
});

module.exports = router;