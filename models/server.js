var ServStatusEnum = Object.freeze({UP: 1, DOWN: 0});
var GameType = Object.freeze({FFA: "FFA", TEAMS: "Teams", EXPERIMENTAL: "Experimental"});

module.exports = function Server(name, host, gamePort, statsPort) {
    this.name = name;
    this.host = host;
    this.gameType = GameType.FFA;
    this.current_players = 0;
    this.spectators = 0;
    this.max_players = 0;
    this.status = ServStatusEnum.DOWN;
    this.gamemode = "";
    this.gamePort = gamePort;
    this.statsPort = statsPort;
    this.update_time = "";
    this.uptime = "";
    this.statistic = [["Time", "Current Players"]];
    this.statisticUpdate = [["Time", "Update(ms)"]];

    this.deleteCounter = 0;
    this.reset = function () {
        this.current_players = 0;
        this.spectators = 0;
        this.max_players = 0;
        this.status = ServStatusEnum.DOWN;
        this.update_time = "";
        this.uptime = "";
        this.gamemode = "";
    }
}