const express = require("express");
const router = express.Router();


module.exports = (playersJSONArray) => {
   router.get("/", (request, result) => {
      const variables = {
         answer: ``,
         playerId: 0
      }

      result.render("search.ejs", variables);
   });

   router.post("/", (request, result) => {

      let { playerName } = request.body;

      const player = playersJSONArray.find(elt => elt.name.toLowerCase() === playerName.toLowerCase());
      let answer = ``;
      if (player) {
         answer += `<strong>${player.name}:</strong><br><br>`;
         answer += `average points per game: ${player.ppg}<br>`;
         answer += `average assists per game: ${player.apg}<br>`;
         answer += `average rebounds per game: ${player.rpg}<br>`;

      } else {
         answer += `Not a valid player name`;
      }
      
      const variables = {
         answer: answer,
         playerId: player ? player.id : 0
      }

      result.render("search", variables);
   });

   return router;
};

