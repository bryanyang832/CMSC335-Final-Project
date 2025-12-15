const fs = require("fs");
const NBA = require("nba");

(async () => {
    const data = await NBA.stats.playerStats({ Season: "2024-25" })
    // const data = await response.json();
    console.log(data);

    let playerStats2025 = [];

    data.leagueDashPlayerStats.forEach(elt => {
        playerStats2025.push({
            name: elt.playerName,
            ppg: elt.pts,
            apg: elt.ast,
            rpg: elt.reb,
            id: elt.playerId
        });
    });

    fs.writeFileSync("playerStats2025.json", JSON.stringify(playerStats2025, null, 2));
})();


