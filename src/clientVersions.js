
var AppInfo = require('./models/appinfo.js');

//clients versions
var clientsVersions = {
    amazon: new AppInfo(125, "5.6.1", ""),
    gp: new AppInfo(130, "5.6.1", ""),
    testVersion: new AppInfo(89, "", ""),
    ios: new AppInfo("1.1.2", "", ""),
};

module.exports = clientsVersions;