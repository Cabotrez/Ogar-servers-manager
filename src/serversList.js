var request = require("request");
var Server = require("./models/server");
var ServStatusEnum = require("./models/serverStatusEnum");
var totals = require("./totalStats");

//CONSTANTS
var FETCH_SERVER_INFO_INTERVAL = 5000; // 5 sec
var SAVE_STATS_INTERVAL = 4 * 60 * 1000; //1 time in 4 min
var DELETE_COUNTER_LIMIT = 120000 / FETCH_SERVER_INFO_INTERVAL; // delete dynamic server after 2 min of shutdown
var MAX_STATS_DATA_LENGTH = 1300;


var serverList = []; //servers list
var totalsFakeServer = totals.totalsFakeServer; //fake server for totals stats


setInterval(getServersInfo, FETCH_SERVER_INFO_INTERVAL);
setInterval(saveStatistic, SAVE_STATS_INTERVAL); 

//getting servers' info with some interval
function getServersInfo() {
    serverList.forEach(function (item, i, arr) {
        fetchServerInfo(item);
        if (item.status == ServStatusEnum.DOWN) {
            item.deleteCounter++;
            // console.log("deleteCounter++");
        }
        if (item.deleteCounter >= DELETE_COUNTER_LIMIT) {
            serverList.splice(i, 1);
            // console.log("deleted");
        }
    });
    
    countTotals();
    serverList.sort(serverSortFunction);
}

function saveStatistic() {
    var time = new Date();
    var timeStr = time.getDate() + " " + time.getHours() + ':' + time.getMinutes();// + ':' + time.getSeconds();
    
    // statisticTotal.push([timeStr, totals.players]);

    totalsFakeServer.statistic.push([timeStr, totals.players]);
    
    function saveStats(item, i, arr) {
        if (item.status == ServStatusEnum.UP) {
            item.statistic.push([timeStr, Math.floor(item.current_players)]);
            item.statisticUpdate.push([timeStr, Math.floor(item.update_time)]);
        }
        if (typeof item.statistic != 'undefined') {
            if (item.statistic.length > MAX_STATS_DATA_LENGTH) {
                item.statistic.splice(1, 1)
                item.statisticUpdate.splice(1, 1)
            }
        }
    }
    
    serverList.forEach(saveStats);
    
    if (totalsFakeServer.statistic.length > MAX_STATS_DATA_LENGTH) {
        totalsFakeServer.statistic.splice(1, 1)
    }
}

function countTotals(){
    totals.players = 0;
    for (key in totals.gameModeTotals) {
        totals.gameModeTotals[key] = 0;
    }
    for (key in totals.gameModesServers) {
        totals.gameModesServers[key] = 0;
    }
    serverList.forEach(function (item, i, arr) {
        if (item.status == ServStatusEnum.UP) {
            totals.players += item.current_players;
            totals.gameModeTotals[item.gameType] += item.current_players;
            totals.gameModesServers[item.gameType] += 1;
        }
    });
    
    if (totals.players > totals.maxPlayers)
        totals.maxPlayers = totals.players;
}

// Check players count on server
function fetchServerInfo(server) {
    
    request({
        uri: "http://" + server.host + ":" + server.statsPort,
        method: "GET",
        timeout: 600
    }, function (error, response, body) {
        if (typeof error != 'undefined') {
            //console.log(error);
            server.reset();
        }
        if (typeof body != 'undefined') {
            try {
                a = JSON.parse(body);
                //console.log(body);
                obj = JSON.parse(body);
                server.current_players = obj.current_players;
                server.spectators = obj.spectators;
                server.max_players = obj.max_players;
                server.status = ServStatusEnum.UP;
                server.update_time = obj.update_time;
                server.uptime = obj.uptime;
                server.gamemode = obj.gamemode;
                server.gamemode_api_id = obj.gamemode_api_id;
                server.name = obj.server_name;
            } catch (e) {
                server.reset();
            }
        }
    });
}

function addServ(request) {
    var body = [];
    
    request.on('error', function (err) {
        console.error(err);
    }).on('data', function (chunk) {
        body.push(chunk);
    }).on('end', function () {
        body = Buffer.concat(body).toString();
        // console.log(body);
        // At this point, we have the headers, method, url and body, and can now
        // do whatever we need to in order to respond to this request.
        try {
            var servIp = request.headers['x-forwarded-for'] ||
            request.connection.remoteAddress ||
            request.socket.remoteAddress ||
            request.connection.socket.remoteAddress;
            //console.log(servIp);
            if (servIp.includes("ffff")) {
                servIp = servIp.substring(servIp.indexOf("ffff") + 5, servIp.length)
            }
            //console.log(servIp);
            var serv = JSON.parse(body);
            var found = serverList.find(function (element, index, array) {
                // console.log(element.port);
                // console.log(serv.port);
                if (element.host === servIp &&
                    element.gamePort === serv.gamePort &&
                    element.statsPort === serv.statsPort) {
                        return element;
                    }
                    // console.log(element);
                })
                //console.log(found);
                if (!found) {
                    
                    serverList.push(new typedServer(serv.name, servIp, serv.gamePort, serv.statsPort, serv.mode, serv.mode_api_id))
                    console.log("serv Added")
                }
            } catch (e) {
                console.log(e);
            }
        });
    }

    function typedServer(name, host, gamePort, statsPort, gameType, apiId) {
        serv = new Server(name, host, gamePort, statsPort);
        serv.gameType = gameType;
        serv.gamemode_api_id = apiId;
        return serv;
    }

function serverSortFunction(a, b) {
    var nameA = a.name.toLowerCase(), nameB = b.name.toLowerCase();
    if (nameA < nameB) //sort string ascending
        return -1;
    if (nameA > nameB)
        return 1;
    return 0; //default return value (no sorting)
}


module.exports = {
    
    serverList,
    addServ 
}