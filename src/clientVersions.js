
var AppInfo = require('./models/appinfo.js');

//clients versions
var clientsVersions = {
    amazon: new AppInfo(137, "5.9.0", ""),
    gp: new AppInfo(137, "5.9.0", ""),
    testVersion: new AppInfo(89, "", ""),
    ios: new AppInfo("1.1.9", "", ""),
};

module.exports = clientsVersions;