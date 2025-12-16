// Setting the encoding to utf8 input stream to automatically decode the 
// incoming binary data into UTF-encoded strings
process.stdin.setEncoding("utf8");

const mongoose = require("mongoose");
const express = require("express");
const app = express();
const path = require("path");
const portNumber = 7003;
const bodyParser = require("body-parser"); /* For post */
const fs = require("fs"); /* Module for file reading */

const session = require("express-session");
app.use(session({
   secret: "secret",
   resave: false,
   saveUninitialized: true
}));

app.use(bodyParser.urlencoded({extended:false})); /* Initializes request.body with post information */ 
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "templates"));
app.use(express.static("public")); // public folder is where we put static content


/* Do not need to comment out before deployment */
require("dotenv").config({
   path: path.resolve(__dirname, "credentialsDontPost/.env"),
   quiet: true
});


// Read playerStats2025.json containing al players and their stats
const fileName = "playerStats2025.json";
let fileContent = fs.readFileSync(fileName, 'utf-8');
const playersJSONArray = JSON.parse(fileContent);
let playersArray = playersJSONArray;

// Get the user schema
const User = require("./model/User.js");
class Game {
   name;
   score;
   round;
   playerOne;
   playerTwo;
   highscore;

   constructor() {
      this.name = "";
      this.score = 0;
      this.round = 1;

      // Initialize the two random nba players
      this.setNewRandomPlayers();
   }

   get name() {
      return this.name;
   }
   set name(name) {
      this.name = name;
   }

   set highscore(highscore) {
      this.highscore = highscore;
   }

   get round() {
      return this.round;
   }

   get score() {
      return this.score;
   }
   get highscore() {
      return this.highscore;
   }

   get playerOne() {
      return this.playerOne;
   }
   get playerTwo() {
      return this.playerTwo;
   }

   nextRound() {
      this.round++;
      this.score++;

      if (this.score > this.highscore) {
         this.highscore = this.score;
      }
      this.setNewRandomPlayers();
   }

   setNewRandomPlayers() {
      this.playerOne = this.getRandomPlayer();
      this.playerTwo = this.getRandomPlayer();
   }

   getRandomPlayer() {
      const randomIndex = Math.floor(Math.random() * playersArray.length);
      const randomPlayer = playersArray[randomIndex];
      return randomPlayer;
   }

   resetGame() {
      this.round = 1;
      this.score = 0;
      this.highscore = 0;
      this.setNewRandomPlayers();
   }

   // Rehydration because calling const game = request.session.game; makes game 
   // a plain object and not a Game instance anymore
   static fromSession(obj) {
      const game = new Game();

      game.name = obj.name;
      game.score = obj.score;
      game.round = obj.round;
      game.highscore = obj.highscore;
      game.playerOne = obj.playerOne;
      game.playerTwo = obj.playerTwo;

      return game;
   }
}


// Initialize the game
// const game = new Game();


// Initialize mongoose
mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
   dbName: "cmsc335_final_project"
}).catch(err => console.error(err));




// Express
app.get("/", (request, result) => {
   result.render("index.ejs");
});

// search endpoint
const searchPageRouter = require("./routes/search.js")(playersJSONArray); // pass in playersJSONArray
app.use("/search", searchPageRouter);


app.get("/gameStart", (request, result) => {
   result.render("gameStart.ejs");
});

app.post("/gameStart", async (request, result) => {
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

app.get("/gamePage", (request, result) => {
   const game = Game.fromSession(request.session.game);
   
   game.nextRound();

   request.session.game = game;

   result.render("gamePage.ejs", {
      name: game.name,
      round: game.round,
      score: game.score,
      playerOne: game.playerOne,
      playerTwo: game.playerTwo,
      highscore: game.highscore
   });
});

app.post("/answer", async (request, result) => {
   try {

      const userChoice = request.body.userChoice;

      const game = request.session.game;

      // Check if the user got the correct answer
      let correct = false;
      if (userChoice === "playerOne" && game.playerOne.ppg > game.playerTwo.ppg) {
         correct = true;
      } else if (userChoice === "playerTwo" && game.playerTwo.ppg > game.playerOne.ppg) {
         correct = true;
      }

      let message = correct ? `Correct!\n\n` : `You Lost!\n\n`;
      message += `${game.playerOne.name} averaged: ${game.playerOne.ppg}\n`;
      message += `${game.playerTwo.name} averaged: ${game.playerTwo.ppg}\n\n`;

      if (!correct) {
         message += `Your final score is: ${game.score}\n`;

         // Check if we need to update DB
         const user = await User.findOne({ name: game.name });
      
         if (user) {
            // Check if their highscore is greater than current score
            if (user.highscore > game.score) {
               message += `You have not beaten your highscore of ${user.highscore}`;
            } else {
               message += `Congrats, you have beaten your highscore of ${user.highscore};\n DB updated`;

               await User.updateOne(
                  { name: game.name }, // filter
                  { $set: { highscore: game.score } }
               );
            }

         } else {
            // Add the user to database
            await User.create({
               name: game.name,
               highscore: game.score
            });

            message += `This is your first time playing, your highscore is ${game.score}`;
         }
      } else {
         message += `Your current score is: ${game.score + 1}`;
      }

      let answer = {
         correct: correct,
         message: message
      }

      result.json(answer);

   } catch (err) {
      console.error(err);
   }
});

app.get("/leaderboard", async (request, result) => {

   try {

      // Get leaderboard information from mongodb
      const topScorers = await User.find({}, {
         name: true,
         highscore: true
      })
      .sort({ highscore: -1 }) // sore by highscore in descending order
      .limit(10);

      let answer = `<table style="border: 0.1rem solid gray;"> `;
      answer += `
      <tr style="font-weight: bold">
         <th style="border: 0.1rem solid gray;">
               Name:
         </th>
         <th style="border: 0.1rem solid gray;">
               Highscore:
         </th>
      </tr>
      `;

      topScorers.forEach(elt => {
         answer += `
            <tr>
               <td style="border: 0.1rem solid gray;">${elt.name}</td>
               <td style="border: 0.1rem solid gray;">${elt.highscore}</td>
            </tr>
         `;
      });

      let variables = {
         leaderboardTable: answer
      }

      result.render("leaderboard.ejs", variables);
   } catch (err) {
      console.error(err);
   }
});






app.listen(portNumber);
console.log(`Web server started and running at http://localhost:${portNumber}`);
/*
    COMMAND LINE PROMPTING
*/
const prompt = "Type stop to shutdown the server: ";
process.stdout.write(prompt);
process.stdin.on("readable", function () {
    const dataInput = process.stdin.read();
    if (dataInput !== null) {
        
        const command = dataInput.trim();
        if (command == "stop") {
            process.stdout.write("Shutting down the server");
            process.exit(0);

        } else {
            process.stdout.write(`Invalid command: ${command}\n`)
        }

        process.stdout.write(prompt);
        process.stdin.resume();
    }
});