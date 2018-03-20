
var AppInfo = require('./models/appinfo.js');

//clients versions
var clientsVersions = {
    amazon: new AppInfo(151, "7.1.1", ""),
    gp: new AppInfo(150, "7.1.0", ""),
    testVersion: new AppInfo(89, "", ""),
    ios: new AppInfo("1.2.6", "", ""),
};

module.exports = clientsVersions;