const LOW_PLAYER_LIMIT = 40;

class GameMode{
    constructor(id, name, limit){
        this.id = id;
        this.name = name;
        this.limit = limit || LOW_PLAYER_LIMIT;
    }
}

const GameModeEnum = Object.freeze({

    UNKNOWN: new GameMode(0, "UNKNOWN"),
    FFA: new GameMode(1, "FFA", 65),
    TEAMS: new GameMode(2, "TEAMS"),
    EXPERIMENTAL: new GameMode(3, "EXPERIMENTAL"),
    INSTANT_MERGE: new GameMode(3, "INSTANT_MERGE"),
    CRAZY: new GameMode(3, "CRAZY"),
    SELF_FEED: new GameMode(3, "SELF_FEED", 30),
    TS2v2: new GameMode(3, "TS2v2", 500),

    getByName: function (name){
        var result = this.UNKNOWN;
        name = name.toLowerCase();
        var values = this.getValues();
        for (var i = 0; i < values.length; i++) {
            if (values[i].name.toLowerCase() == name) {
                return values[i];
            }
        }
        return result;
    },
    getById: function (id) {
        var values = this.getValues();
        for (var i = 0; i < values.length; i++) {
            if (values[i].id == id) {
                return values[i];
            }
        }
    },
    getValues: function () {
        var res = [];
        for (var key in this){
            if (typeof this[key] !== "function"){
                res.push(this[key]);
            }
        }
        return res;
    }
});

module.exports = GameModeEnum;