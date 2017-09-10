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
var fs = require("fs");
var path = require('path');
var Server = require('./models/server');
var ServStatusEnum = require("./models/serverStatusEnum");
var clientsVersions = require('./clientVersions');
var srvList = require("./serversList");
var addServ = require("./serversList").addServ
var GameType = require("./models/gameType")
// var totalsFakeServer = totals.totalsFakeServer;

require("./statsServers") //start stats server on 81,82,83 ports


// CONSTANTS
// if server have players count lower than this value, forcing move players to this server 
var LOW_PLAYER_LIMIT = 40;
var NORMAL_PLAYER_LIMIT = 120;


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
    
    var gameTypeName = GameType.getByName(requestLowerCase);
    
    var alive_servers = srvList.optServerList.filter(item => {
        return item.status == ServStatusEnum.UP && item.gamemode == gameTypeName;
    })
    
    //adjust low player limit for current game mode
    var lowPlayerLimit = GameType.getLowPlayerLimit(gameTypeName, LOW_PLAYER_LIMIT);
    console.dir({gameTypeName, lowPlayerLimit});

    for (var i = 0; i < alive_servers.length; i++) {
        if (alive_servers[i].current_players < alive_servers[i].max_players) {
            var chance = 1 - alive_servers[i].current_players / alive_servers[i].max_players;
            // console.log({chance, lowPlayerLimit})
            if (Math.random() < chance || alive_servers[i].current_players < lowPlayerLimit) {
                response.end(alive_servers[i].host + ":" + alive_servers[i].gamePort + "\n" + alive_servers[i].gamemode);
                return;
            }
        }
    }
    // response.end(JSON.stringify({as:lowPlayerLimit}));
    response.end();
}).listen(80);
