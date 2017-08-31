var Server = require("./models/server")

/**
* Stores totals stats
*/
var totals = {
    players: 0,
    maxPlayers: 0,
    updateTime: 0,
    gameModeTotals: {}, //stores players count for each game mode
    gameModesServers: {},//count of servers for each game mode  
    totalsFakeServer: new Server("Totals", "", "", ""), //fake server for totals stats
    GPtotalsFakeServer: new Server("GP Totals", "", "", ""), //fake server for totals stats
    buildTotals: function () {
        var gameModePerc = {};//create new object with percents
        for (key in this.gameModeTotals) {
            gameModePerc[key] = parseFloat((this.gameModeTotals[key] / this.players * 100).toFixed(1));
        }
        
        var result = {
            'total_players': this.players, 
            'max_total_players': this.maxPlayers, 
            'totals.gameModeTotals': this.gameModeTotals,
            'gameModesPercentage': this.gameModePerc,
            'gameModesServers': this.gameModesServers
        };
        
        return result;
    }
}


module.exports = totals;