
var AppInfo = require('./models/appinfo.js');

//clients versions
var clientsVersions = {
    amazon: new AppInfo(125, "a_fr5.0.1", ""),
    gp: new AppInfo(128, "5.5.1", ""),
    testVersion: new AppInfo(89, "", ""),
    ios: new AppInfo("1.1.0", "", ""),
};

module.exports = clientsVersions;