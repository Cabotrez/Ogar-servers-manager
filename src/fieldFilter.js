var filteringFields = Object.freeze({
    statistic: true,
    statisticUpdate: true,
    gameType: true,
    deleteCounter: true,
})


module.exports = function (key, value) {
    if (key in filteringFields) {
        return undefined;
    } else {
        return value;
    }
}