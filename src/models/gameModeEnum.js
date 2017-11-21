// if server have players count lower than this value, forcing move players to this server 
const LOW_PLAYER_LIMIT = 40;
const NO_EXP_PLAYER_LIMIT = 10;

class GameMode {
    constructor(id, name, limit) {
        this.id = id;
        this.name = name;
        this.limit = limit || LOW_PLAYER_LIMIT;
        Object.freeze(this);
    }
}

const GameModeEnum = Object.freeze({

    UNKNOWN: new GameMode(0, "UNKNOWN"),
    FFA: new GameMode(1, "FFA", 65),
    TEAMS: new GameMode(2, "TEAMS"),
    EXPERIMENTAL: new GameMode(3, "EXPERIMENTAL"),
    INSTANT_MERGE: new GameMode(4, "INSTANTMERGE"),
    CRAZY: new GameMode(5, "CRAZY"),
    SELF_FEED: new GameMode(6, "SELFFEED", 30),
    TS2v2: new GameMode(7, "TS2v2", 500),
    ULTRA: new GameMode(8, "ULTRA", 25),

    adjustExp: function (gameMode, exp, server) {
        if (!gameMode || !exp || !server){
            throw new Error("No needed params");
        }
        switch (gameMode) {
            case this.SELF_FEED:
                exp = Math.min(Math.pow(exp, 10 / 41), 3500) >> 0;
                break;
            case this.CRAZY:
                exp = Math.pow(exp, 10 / 20) >> 0;
                break;
            case this.TS2v2:
            case this.ULTRA:
            case this.UNKNOWN:
                exp = 0;
                break;
        }

        //do not add exp for almost empty servers
        if (gameMode != this.TS2v2 && gameMode != this.SELF_FEED) {
            if (server.current_players < NO_EXP_PLAYER_LIMIT) {
                exp = 0;
            }
        }

        if (gameMode != this.CRAZY && gameMode != this.INSTANT_MERGE) {
            exp *= 2 >> 0; //more exp for other game modes
        }
        return exp;
    },

    getByName: function (name) {
        if (name === "") {
            return this.FFA; //return FFA if no name
        }
        name = name.toLowerCase();
        var result = this.getValues().find(item => item.name.toLowerCase() == name) || this.UNKNOWN;
        return result;
    },
    getById: function (id) {
        var result = this.getValues().find(item => item.id == id) || this.UNKNOWN;
        return result;
    },
    getValues: function () {
        var res = [];
        for (var key in this) {
            if (typeof this[key] !== "function") {
                res.push(this[key]);
            }
        }
        return res;
    }
});

module.exports = GameModeEnum;