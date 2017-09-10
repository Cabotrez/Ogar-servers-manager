module.exports = Object.freeze({
    FFA: "FFA",
    TEAMS: "Teams",
    EXPERIMENTAL: "Experimental",
    INSTANT_MERGE: "InstantMerge",
    CRAZY: "CRAZY",
    SELF_FEED: "SelfFeed",
    TS2v2: "TS2v2",

    getByName: function (name) {
        name = name.toLowerCase();
        var result = this.FFA;

        if (name.match('teams')) {
            result = this.TEAMS;
        } else if (name.match('experimental')) {
            result = this.EXPERIMENTAL;   
        } else if (name.match('instantmerge')) {
            result = this.INSTANT_MERGE;
        } else if (name.match('crazy')) {
            result = this.CRAZY;
        } else if (name.match('selffeed')) {
            result = this.SELF_FEED;
        } else if (name.match('ts2v2')) {
            result = this.TS2v2;
        }

        return result;
    },
    getLowPlayerLimit: function (gameType, defValue) { //arrow fucntions isn't allowed here
        var res = defValue;
        switch (gameType){
            case this.FFA:
                res = 65;
                break;
            case this.SELF_FEED:
                res = 30;
                break;
            case this.TS2v2:
                res = 4;
                break;
        }
        return res;
    }
});