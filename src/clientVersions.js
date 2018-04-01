
var AppInfo = require('./models/appinfo.js');

//clients versions
var clientsVersions = {
    amazon: new AppInfo(151, "7.1.1", ""),
    gp: new AppInfo(154, "7.3.0", ""),
    testVersion: new AppInfo(89, "", ""),
    ios: new AppInfo("1.2.8", "", ""),
};

module.exports = clientsVersions;
