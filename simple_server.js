var http = require("http");
var request = require("request");
var ejs = require("ejs");
var fs = require("fs");

// CONSTANTS
//var PLAYER_LIMIT = 1;
var ServStatusEnum = Object.freeze({UP: 1, DOWN: 0});
var total_players = 0;
var max_total_players = 0;
var SAVE_STATS_PERIOD = 3; //3 days
var MAX_STATS_DATA_LENGTH = 100;

function Server(host, gamePort, statsPort) {
    this.host = host;
    this.current_players = 0;
    this.max_players = 0;
    this.status = ServStatusEnum.DOWN;
    this.gamemode = "";
    this.gamePort = gamePort;
    this.statsPort = statsPort;
    this.update_time = "";
    this.uptime = "";
    this.reset = function () {
        this.current_players = 0;
        this.max_players = 0;
        this.status = ServStatusEnum.DOWN;
        this.update_time = "";
        this.uptime = "";
        this.gamemode = "";
    }
}

var serverList = [];
serverList.push(new Server("178.62.49.237", "443", "88")); //DigitalOcean Master VPS
serverList.push(new Server("46.101.82.140", "443", "88")); //DigitalOcean 2 
serverList.push(new Server("149.56.103.53", "443", "88")); //OVH VPS
//serverList.push(new Server("46.185.52.171", "4431", "88")); //ноут
//serverList.push(new Server("blob-f0ris.c9users.io","8080","8082"));

var teamsServer = new Server("149.56.103.53", "444", "89");
var experimentalServer = new Server("149.56.103.53", "447", "90");

var statistic = [["Time", "Update(ms)"]];
var statistic2 = [["Time", "Current Players"]];
var statisticTotal = [["Time", "Total Players"]];

//getting servers' info with some interval
setInterval(function () {
    serverList.forEach(function (item, i, arr) {
        checkPlayers(item);
    });
    checkPlayers(teamsServer);
    checkPlayers(experimentalServer);

	//counting totals
	total_players = 0;
    serverList.forEach(function (item, i, arr) {
        if (item.status == ServStatusEnum.UP) {
            total_players += item.current_players;
        }
    });

    total_players += teamsServer.current_players;
    total_players += experimentalServer.current_players;

    if (total_players > max_total_players)
        max_total_players = total_players;


}, 5000);

//saving statistic
setInterval(function () {
    var time = new Date();
    var timeStr = time.getDate() + " " + time.getHours() + ':' + time.getMinutes();// + ':' + time.getSeconds();

    if (teamsServer.current_players != 0) {
        statistic.push([timeStr, Math.floor(teamsServer.update_time)]);
        statistic2.push([timeStr, Math.floor(teamsServer.current_players)]);
        statisticTotal.push([timeStr, total_players]);
    }
    if (statistic.length * 2 > MAX_STATS_DATA_LENGTH){
      var step  = Math.floor(statistic.length / MAX_STATS_DATA_LENGTH)
      for (i=0; i<arr.length; i+=2){
       statistic.splice(i,1)
       statistic2.splice(i,1)
       statisticTotal.splice(i,1)
   }
}

}, 60000);

//return servers' stats 
http.createServer(function (request, response) {
    response.writeHead(200, {"Content-Type": "text/plain"});
    serverList.push(teamsServer);
    serverList.push(experimentalServer);
    serverList.push({'total_players': total_players, 'max_total_players': max_total_players});
    response.write(JSON.stringify(serverList));
    serverList.splice(serverList.length - 3, 3);//deleting temporary objects
    response.end();
}).listen(81);

//show statistic in chart
http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});

    //since we are in a request handler function
    //we're using readFile instead of readFileSync
    fs.readFile('chart_template.html', 'utf-8', function (err, content) {
        if (err) {
            res.end('error occurred');
            return;
        }

        var data = JSON.stringify(statistic);
        var data2 = JSON.stringify(statistic2);
        var renderedHtml = ejs.render(content, {datastr: data, datastr2: data2, total: JSON.stringify(statisticTotal)});  //get rendered HTML code
        res.end(renderedHtml);
    });
}).listen(82);

//choosing and giving back server's ip
http.createServer(function (request, response) {
    response.writeHead(200, {"Content-Type": "text/plain"});

    if (request.url.match('teams')) {
        response.write(teamsServer.host + ":" + teamsServer.gamePort);
        response.end();
        return;
    }

    if (request.url.match('experimental')) {
        response.write(experimentalServer.host + ":" + experimentalServer.gamePort);
        response.end();
        return;
    }

    var alive_servers = [];
    serverList.forEach(function (item, i, arr) {
        if (item.status == ServStatusEnum.UP) {
            alive_servers.push(item);
        }
    });

    //uniform players distribution between active servers
    if (alive_servers.length != 0) {
        index = Math.floor(Math.random() * alive_servers.length);
        response.write(alive_servers[index].host + ":" + alive_servers[index].gamePort);
    }

    response.end();
}).listen(80);

// Check players count on server
function checkPlayers(server) {

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
