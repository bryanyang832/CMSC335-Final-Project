class Game {

   // is the array of players. Each player has a name, ppg, apg, rpg, id
   static playersJSONArray;  

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
      const randomIndex = Math.floor(Math.random() * Game.playersJSONArray.length);
      const randomPlayer = Game.playersJSONArray[randomIndex];
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

module.exports = Game;