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
var addServ = require("./serversList").addServ;
var GameModeEnum = require('./models/gameModeEnum');
// var totalsFakeServer = totals.totalsFakeServer;

require("./statsServers") //start stats servers on 81,82,83 ports


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

    requestLowerCase = requestLowerCase.replace("/gp","");

    var gameMode = GameModeEnum.getByName(requestLowerCase.replace("/",""));
    if (gameMode == GameModeEnum.UNKNOWN) {
        response.end("Unknown game mode");
        return;
    }

    if (gameMode == GameModeEnum.CUSTOM) {
        gameMode = GameModeEnum.TS2v2; // custom and ts2v2 works on same master server instance
    }
    
    var alive_servers = srvList.optServerList.filter(item => {
        return item.status == ServStatusEnum.UP && item.gamemode_api_id == gameMode.id;
    })
    
    //adjust low player limit for current game mode
    var lowPlayerLimit = gameMode.limit;
    
    //another one trick to distribute players over servers
    if (gameMode.id % 2 == 0){
        alive_servers.reverse();
    }
    // console.dir({gameTypeName, lowPlayerLimit});
    
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
    
    //random - in case if previous code didn't return anything
    if (alive_servers.length > 0){
        var i = Math.floor(alive_servers.length * Math.random());
        response.end(alive_servers[i].host + ":" + alive_servers[i].gamePort + "\n" + alive_servers[i].gamemode);
        return;
    }
    response.end();
}).listen(888);
