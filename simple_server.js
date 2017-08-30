/*  Ogar-server-manager is a nodejs script to manage,get statistics and distribute players over Ogar servers
 Copyright (C) 2016  Zakhariev Anton
 This program is free software; you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation; either version 3 of the License, or
 (at your option) any later version.
 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
 You should have received a copy of the GNU General Public License
 along with this program; if not, write to the Free Software Foundation,
 Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301  USA */

var http = require("http");
var request = require("request");
// var ejs = require("ejs");
var fs = require("fs");
var path = require('path');
var Server = require('./models/server.js');
var clientsVersions = require('./clientVersions');

// CONSTANTS
var ServStatusEnum = Object.freeze({UP: 1, DOWN: 0});
var GameType = require("./models/gameType")
var total_players = 0;
var gp_total_players = 0;
var max_total_players = 0;
var gp_max_total_players = 0;
var gameModeTotals = {}; //stores players count for each game mode
var gameModesServers = {}; //count of servers for each game mode

var MAX_STATS_DATA_LENGTH = 1300;
var FETCH_SERVER_INFO_INTERVAL = 5000;
var DELETE_COUNTER_LIMIT = 120000 / FETCH_SERVER_INFO_INTERVAL; // delete dynamic server after 2 min of shutdown

// if server have players count lower than this value, forcing move players to this server 
var LOW_PLAYER_LIMIT = 30;
var NORMAL_PLAYER_LIMIT = 120;


function typedServer(name, host, gamePort, statsPort, gameType, apiId) {
    serv = new Server(name, host, gamePort, statsPort);
    serv.gameType = gameType;
    serv.gamemode_api_id = apiId;
    return serv;
}

var serverList = []; //servers list
// serverList.push(new Server(" Master VPS", "178.62.49.237", 443, 88)); //DigitalOcean Master VPS, space at start for first place after sorting
//serverList.push(new Server("blob-f0ris.c9users.io","8080","8082"));


var totalsFakeServer = new Server("Totals", "", "", ""); //fake server for totals stats
var GPtotalsFakeServer = new Server("GP Totals", "", "", ""); //fake server for totals stats

var GPserverList = []; //dynamic server list



//getting servers' info with some interval
setInterval(function () {
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

    //counting totals
    total_players = 0;
    for (key in gameModeTotals) {
        gameModeTotals[key] = 0;
    }
    for (key in gameModesServers) {
        gameModesServers[key] = 0;
    }
    serverList.forEach(function (item, i, arr) {
        if (item.status == ServStatusEnum.UP) {
            total_players += item.current_players;
            gameModeTotals[item.gameType] += item.current_players;
            gameModesServers[item.gameType] += 1;
        }
    });

    if (total_players > max_total_players)
        max_total_players = total_players;

    serverList.sort(serverSortFunction);

    /*************  Google Players**********/

    GPserverList.forEach(function (item, i, arr) {
        fetchServerInfo(item);
        if (item.status == ServStatusEnum.DOWN) {
            item.deleteCounter++;
            // console.log("deleteCounter++");
        }
        if (item.deleteCounter >= DELETE_COUNTER_LIMIT) {
            GPserverList.splice(i, 1);
            // console.log("deleted");
        }
    });

    //counting totals
    gp_total_players = 0;
    GPserverList.forEach(function (item, i, arr) {
        if (item.status == ServStatusEnum.UP) {
            gp_total_players += item.current_players;
        }
    });

    if (gp_total_players > gp_max_total_players)
        gp_max_total_players = gp_total_players;

}, FETCH_SERVER_INFO_INTERVAL);

//saving statistic
setInterval(function () {
    var time = new Date();
    var timeStr = time.getDate() + " " + time.getHours() + ':' + time.getMinutes();// + ':' + time.getSeconds();

    // statisticTotal.push([timeStr, total_players]);
    totalsFakeServer.statistic.push([timeStr, total_players]);
    GPtotalsFakeServer.statistic.push([timeStr, gp_total_players]);

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
    GPserverList.forEach(saveStats);

    if (totalsFakeServer.statistic.length > MAX_STATS_DATA_LENGTH) {
        totalsFakeServer.statistic.splice(1, 1)
    }
    if (GPtotalsFakeServer.statistic.length > MAX_STATS_DATA_LENGTH) {
        GPtotalsFakeServer.statistic.splice(1, 1)
    }
}, 4 * 60 * 1000); //1 time in 4 min

http.createServer(function (request, response) {
    showStats(response);
}).listen(81);

//show statistic in chart
http.createServer(function (request, response) {
    response.writeHead(200, {'Content-Type': 'text/html'});
    if (request.url.match('stats')) {
        response.writeHead(200, {'Content-Type': 'application/json'});
        serverList.push(totalsFakeServer);
        response.write(JSON.stringify(serverList, (key,value) => 
            key == "statisticUpdate" ? undefined : value 
        ));
        serverList.splice(serverList.length - 1, 1);
        response.end();
        return;
    }

    //since we are in a request handler function
    //we're using readFile instead of readFileSync
    fs.readFile(path.join(__dirname, 'chart_template.html'), 'utf-8', function (err, content) {
        if (err) {
            response.end('error occurred' + err);
            return;
        }

        // var renderedHtml = ejs.render(content, {serverList: JSON.stringify(serverList, replacerForGraph)});  //get rendered HTML code

        // response.end(renderedHtml);
        response.end(content);
    });
}).listen(82);

//show statistic in chart
http.createServer(function (request, response) {
    response.writeHead(200, {'Content-Type': 'text/html'});
    if (request.url.match('stats')) {
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.write(JSON.stringify(serverList, (key,value) => 
            key == "statistic" ? undefined : value 
        ));
        response.end();
        return;
    }

    //since we are in a request handler function
    //we're using readFile instead of readFileSync
    fs.readFile(path.join(__dirname, 'chart_template_update.html'), 'utf-8', function (err, content) {
        if (err) {
            response.end('error occurred' + err);
            return;
        }
        response.end(content);
    });
}).listen(83);

//choosing and giving back server's ip
http.createServer(function (request, response) {
    response.writeHead(200, {"Content-Type": "text/plain"});

    var requestLowerCase = request.url.toLowerCase()
    if (requestLowerCase.match('cl_ver')) {
        response.end(JSON.stringify({versions: clientsVersions}));
        return;
    }

    if (requestLowerCase.match('addserv')) {
        console.log("addserv");
        addServ(request);
        return;
    }


    if (requestLowerCase.match('stats')) {
        showStats(response);
        return;
    }

    var gameType = GameType.FFA;

    if (requestLowerCase.match('teams')) {
        gameType = GameType.TEAMS;
    } else if (requestLowerCase.match('experimental')) {
        gameType = GameType.EXPERIMENTAL;   
    } else if (requestLowerCase.match('instantmerge')) {
        gameType = GameType.INSTANT_MERGE;
    } else if (requestLowerCase.match('crazy')) {
        gameType = GameType.CRAZY;
    } else if (requestLowerCase.match('selffeed')) {
        gameType = GameType.SELF_FEED;
    }

    var list;
    if (requestLowerCase.match('gp')) {
        //list = GPserverList;
        list = serverList;
    } else {
        list = serverList;
    }

    var alive_servers = [];
    list.forEach(function (item, i, arr) {
        if (item.status == ServStatusEnum.UP && item.gameType == gameType) {
            alive_servers.push(item);
        }
    });
    
    var lowPlayerLimit = (gameType == GameType.FFA ? 65 : LOW_PLAYER_LIMIT  ); // custom player limit for FFA
    // console.log(lowPlayerLimit);
    for (var i = 0; i < alive_servers.length; i++) {
        if (alive_servers[i].current_players < alive_servers[i].max_players) {
            var chance = 1 - alive_servers[i].current_players / alive_servers[i].max_players;
            console.log({chance, lowPlayerLimit})
            if (Math.random() < chance || alive_servers[i].current_players < lowPlayerLimit) {
                response.write(alive_servers[i].host + ":" + alive_servers[i].gamePort + "\n" + alive_servers[i].gameType);
                response.end();
                return;
            }
        }
    }

    //uniform players distribution between active servers
    if (alive_servers.length != 0) {
        index = Math.floor(Math.random() * alive_servers.length);
        //console.log(alive_servers[index]);
        response.write(alive_servers[index].host + ":" + alive_servers[index].gamePort + "\n" + alive_servers[index].gameType);
        //console.log(alive_servers[index].host + ":" + alive_servers[index].gamePort + "\n" + alive_servers[index].gameType);
    }

    response.end();
}).listen(80);

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

//return servers' stats 
function showStats(response) {
    response.writeHead(200, {"Content-Type": "application/json"});

    var gameModePerc = {};//create new object with percents
    for (key in gameModeTotals) {
        gameModePerc[key] = parseFloat((gameModeTotals[key] / total_players * 100).toFixed(1));
    }

    var totals = [{'total_players': total_players, 
                   'max_total_players': max_total_players, 
                   'gameModeTotals': gameModeTotals,
                   'gameModesPercentage': gameModePerc,
                   'gameModesServers': gameModesServers},
                  {'gp_total_players': gp_total_players, 
                   'gp_max_total_players': gp_max_total_players}];

    serverList.push(totals[0]);

    if (GPserverList.length > 0) {
        GPserverList.push(totals[1]);
        finalList = {Amazon: serverList, GooglePlay: GPserverList, Totals: totals};
    } else {
        finalList = {Amazon: serverList};
    }
    response.write(JSON.stringify(finalList, require("./fieldFilter")));
    response.end();

    //deleting temporary objects
    serverList.splice(serverList.length - 1, 1);
    GPserverList.splice(GPserverList.length - 1, 1);//deleting temporary objects
};

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

function serverSortFunction(a, b) {
    var nameA = a.name.toLowerCase(), nameB = b.name.toLowerCase();
    if (nameA < nameB) //sort string ascending
        return -1;
    if (nameA > nameB)
        return 1;
    return 0; //default return value (no sorting)
}
