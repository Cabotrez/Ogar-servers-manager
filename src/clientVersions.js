
var AppInfo = require('./models/appinfo.js');

//clients versions
var clientsVersions = {
    amazon: new AppInfo(148, "7.0.2", ""),
    gp: new AppInfo(148, "7.0.2", ""),
    testVersion: new AppInfo(89, "", ""),
    ios: new AppInfo("1.2.5", "", ""),
};

module.exports = clientsVersions;