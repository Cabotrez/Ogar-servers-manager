var http = require("http");
var request = require("request");
// var ejs = require("ejs");
var fs = require("fs");
var path = require('path');

// CONSTANTS
//var PLAYER_LIMIT = 1;
var ServStatusEnum = Object.freeze({UP: 1, DOWN: 0});
var GameType = Object.freeze({FFA: "Free For All", TEAMS: "Teams", EXPERIMENTAL: "Experimental"});
var total_players = 0;
var gp_total_players = 0;
var max_total_players = 0;
var gp_max_total_players = 0;
var MAX_STATS_DATA_LENGTH = 1000;
var FETCH_SERVER_INFO_INTERVAL = 5000;
var DELETE_COUNTER_LIMIT = 120000/FETCH_SERVER_INFO_INTERVAL; // delete dynamic server after 2 min of shutdown

// if server have players count lower than this value, forcing move playres to this server 
var LOW_PLAYER_LIMIT = 30; 
var NORMAL_PLAYER_LIMIT = 120; 

function Server(name, host, gamePort, statsPort) {
    this.name = name;
    this.host = host;
    this.gameType = GameType.FFA;
    this.current_players = 0;
    this.max_players = 0;
    this.status = ServStatusEnum.DOWN;
    this.gamemode = "";
    this.gamePort = gamePort;
    this.statsPort = statsPort;
    this.update_time = "";
    this.uptime = "";
    this.statistic = [["Time", "Current Players"]];
    this.statisticUpdate = [["Time", "Update(ms)"]];

    this.deleteCounter = 0;
    this.reset = function () {
        this.current_players = 0;
        this.max_players = 0;
        this.status = ServStatusEnum.DOWN;
        this.update_time = "";
        this.uptime = "";
        this.gamemode = "";
    }
}

function typedServer(name, host, gamePort, statsPort, gameType) {
    serv = new Server(name, host, gamePort, statsPort);
    serv.gameType = gameType;
    return serv;
}

var serverList = []; //static server list
serverList.push(new Server(" Master VPS", "178.62.49.237", 443, 88)); //DigitalOcean Master VPS, space at start for first place after sorting
serverList.push(new Server("DO 2", "46.101.82.140", 443, 88)); //DigitalOcean 2 
serverList.push(new Server("OVH ", "149.56.103.53", 443, 88)); //OVH VPS
//serverList.push(new Server("blob-f0ris.c9users.io","8080","8082"));

serverList.push(new typedServer("OVH teams","149.56.103.53", 444, 89, GameType.TEAMS));
serverList.push(new typedServer("OVH experimental","149.56.103.53", 447, 90, GameType.EXPERIMENTAL));


var totalsFakeServer = new Server("Totals","", "", ""); //fake server for totals stats
var GPtotalsFakeServer = new Server("GP Totals","", "", ""); //fake server for totals stats

var GPserverList = []; //dynamic server list
// GPserverList.push(new Server("FFA","46.101.82.140", "443", "88"));
// GPserverList.push(new typedServer("GP TEAMS","46.101.82.140", "444", "88", GameType.TEAMS));
// GPserverList.push(new typedServer("GP experimental","46.101.82.140", "447", "88", GameType.EXPERIMENTAL));

//getting servers' info with some interval
setInterval(function () {
    serverList.forEach(function (item, i, arr) {
        fetchServerInfo(item);
        if (item.status == ServStatusEnum.DOWN){
            item.deleteCounter++;
            // console.log("deleteCounter++");
        }
        if (item.deleteCounter >= DELETE_COUNTER_LIMIT){
            serverList.splice(i, 1);
            // console.log("deleted");
        }
    });
   
	//counting totals
	total_players = 0;
    serverList.forEach(function (item, i, arr) {
        if (item.status == ServStatusEnum.UP) {
            total_players += item.current_players;
        }
    });

    if (total_players > max_total_players)
        max_total_players = total_players;

    serverList.sort(serverSortFunction);

    /*************  Google Players**********/

    GPserverList.forEach(function (item, i, arr) {
        fetchServerInfo(item);
        if (item.status == ServStatusEnum.DOWN){
            item.deleteCounter++;
            // console.log("deleteCounter++");
        }
        if (item.deleteCounter >= DELETE_COUNTER_LIMIT){
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
        
        if (typeof item.statistic != 'undefined'){
            if (item.statistic.length > MAX_STATS_DATA_LENGTH){
                item.statistic.splice(1,1)
                item.statisticUpdate.splice(1,1)   
            }
    }
    }

    serverList.forEach(saveStats);
    GPserverList.forEach(saveStats);


    if (totalsFakeServer.statistic.length > MAX_STATS_DATA_LENGTH){
        totalsFakeServer.statistic.splice(1,1)
    }
    if (GPtotalsFakeServer.statistic.length > MAX_STATS_DATA_LENGTH){
        GPtotalsFakeServer.statistic.splice(1,1)
    }
                

}, 4*60*1000); //1 time in 4 min

http.createServer(function (request, response) {
    showStats(response);
}).listen(81);

//show statistic in chart
http.createServer(function (request, response) {
    response.writeHead(200, {'Content-Type': 'text/html'});
     if (request.url.match('stats')) {
        serverList.push(totalsFakeServer);
        response.write(JSON.stringify(serverList, replacerForGraph));
        serverList.splice(serverList.length - 1, 1);
        response.end();
        return;
    }

    //since we are in a request handler function
    //we're using readFile instead of readFileSync
    fs.readFile(path.join(__dirname, 'chart_template.html'), 'utf-8', function (err, content) {
        if (err) {
            response.end('error occurred'+err);
            return;
        }

        // var renderedHtml = ejs.render(content, {serverList: JSON.stringify(serverList, replacerForGraph)});  //get rendered HTML code

        // response.end(renderedHtml);
        response.end(content);
    });
}).listen(82);

//choosing and giving back server's ip
http.createServer(function (request, response) {
    response.writeHead(200, {"Content-Type": "text/plain"});

    if (request.url.toLowerCase().match('addserv')){
        console.log("addserv");
        addServ(request);
        return;
    } 


    if (request.url.toLowerCase().match('stats')){
        showStats(response);
        return;
    }

    var gameType = GameType.FFA;

    if (request.url.toLowerCase().match('teams')) {
        gameType = GameType.TEAMS;
    } else if (request.url.toLowerCase().match('experimental')) {
        gameType = GameType.EXPERIMENTAL;
    }

    var list;
    if (request.url.toLowerCase().match('gp')){
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

    for (var i = 0; i < alive_servers.length; i++) {
        if (alive_servers[i].current_players < NORMAL_PLAYER_LIMIT) {
				var chance =  1 - alive_servers[i].current_players/NORMAL_PLAYER_LIMIT;
				if (Math.random() < chance || alive_servers[i].current_players < LOW_PLAYER_LIMIT){
					response.write(alive_servers[i].host + ":" + alive_servers[i].gamePort);
                    response.end();
                    return;
				} /*else if (i < alive_servers.length - 1){
					response.write(alive_servers[i+1].host + ":" + alive_servers[i+1].gamePort);
                    response.end();
                    return;
				}*/
                //if (Math.floor(Math.random() * 10) != 0) { //90% probabily to return this server
				//100% return this server
                    //response.write(alive_servers[i].host + ":" + alive_servers[i].gamePort);
                    //response.end();
                    //return;
                //}
        }
    }

    //uniform players distribution between active servers
    if (alive_servers.length != 0) {
        index = Math.floor(Math.random() * alive_servers.length);
        response.write(alive_servers[index].host + ":" + alive_servers[index].gamePort);
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
                server.max_players = obj.max_players;
                server.status = ServStatusEnum.UP;
                server.update_time = obj.update_time;
                server.uptime = obj.uptime;
                server.gamemode = obj.gamemode;
            } catch (e) {
                server.reset();
            }
        }
    });
}

//return servers' stats 
function showStats(response) {
    response.writeHead(200, {"Content-Type": "text/plain"});

    var totals = [{'total_players': total_players, 'max_total_players': max_total_players},
                  {'gp_total_players': gp_total_players, 'gp_max_total_players': gp_max_total_players}]; 

    serverList.push(totals[0]);
    
    if (GPserverList.length > 0){
        GPserverList.push(totals[1]);
        finalList = {Amazon:serverList, GooglePlay:GPserverList, Totals:totals};
    } else {
        finalList = {Amazon:serverList};
    }
    response.write(JSON.stringify(finalList, replacer));
    response.end();

    //deleting temporary objects
    serverList.splice(serverList.length - 1, 1);
    GPserverList.splice(GPserverList.length - 1, 1);//deleting temporary objects
};

function addServ(request){
    var body = [];

        request.on('error', function(err) {
            console.error(err);
          }).on('data', function(chunk) {
            body.push(chunk);
          }).on('end', function() {
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
				if (servIp.includes("ffff")){
					servIp = servIp.substring(servIp.indexOf("ffff") + 5,servIp.length)
				}
				//console.log(servIp);
                var serv = JSON.parse(body);
                var found = serverList.find(function(element, index, array){
                    // console.log(element.port);
                    // console.log(serv.port);
                    if (element.host === servIp &&
                        element.gamePort === serv.gamePort &&
                        element.statsPort === serv.statsPort){
                        return element;
                    }
                    // console.log(element);
                })
                console.log(found);
                if (!found){
					
                    serverList.push(new typedServer(serv.name, servIp, serv.gamePort, serv.statsPort, serv.mode))
                    console.log("serv Added")
                }
            } catch (e) {
				console.log(e);
            }            
          });
}

//excluding statistic fields from JSON for 81 port
function replacer(key,value)
{
    if (key== "statistic" || 
        key== "statisticUpdate" ||
        key== "gameType" ||
        key == "deleteCounter") return undefined;
    else return value;
}

function replacerForGraph(key,value)
{
    if (key=="statisticUpdate") return undefined;
    else return value;
}

function serverSortFunction(a, b){
    var nameA = a.name.toLowerCase(), nameB = b.name.toLowerCase();
    if (nameA < nameB) //sort string ascending
        return -1;
    if (nameA > nameB)
        return 1;
    return 0; //default return value (no sorting)
}