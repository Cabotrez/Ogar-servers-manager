
var AppInfo = require('./models/appinfo.js');

//clients versions
var clientsVersions = {
    amazon: new AppInfo(108, "a_fr5.0.1", ""),
    gp: new AppInfo(112, "gp_fr5.1.2", ""),
    testVersion: new AppInfo(89, "", ""),
    ios: new AppInfo("1.0.9", "", ""),
};

module.exports = clientsVersions;