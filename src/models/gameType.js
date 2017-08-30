module.exports = Object.freeze({
    FFA: "FFA",
    TEAMS: "Teams",
    EXPERIMENTAL: "Experimental",
    INSTANT_MERGE: "InstantMerge",
    CRAZY: "CRAZY",
    SELF_FEED: "SelfFeed",

    getByName: function (name){
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
        }
        return result;
    }
});