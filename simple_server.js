var http = require("http");
var request = require("request");

// CONSTANTS
//var PLAYERS_LIMIT = 1;
var ServStatusEnum = Object.freeze({UP: 1, DOWN: 0});
var total_players = 0; 

function Server (host,gamePort,statsPort) {
    this.host = host;
	this.current_players = 0;
	this.max_players = 0;
	this.status = ServStatusEnum.DOWN;
    this.gamePort = gamePort;
    this.statsPort = statsPort;
	this.uptime = "";
}

var serverList = [];
serverList.push(new Server("178.62.49.237","4431","88")); //DigitalOcean VPS
serverList.push(new Server("178.62.6.32","4431","88")); //DigitalOcean VPS 2
serverList.push(new Server("109.162.104.184","4431","88")); //home notebook
serverList.push(new Server("95.46.98.153","4431","88")); //GMHost VPS
serverList.push(new Server("blob-f0ris.c9users.io","8080","8082"));

//берем инфу с серверов с определенным интервалом
setInterval(function(){
	serverList.forEach(function(item, i, arr){
		checkPlayers(item);
	});
}, 5000); 


//server's stats 
http.createServer(function (request, response) {
    response.writeHead(200, {"Content-Type": "text/plain"});
	serverList.push({'total_players':total_players});
	response.write(JSON.stringify(serverList));
	serverList.splice(serverList.length-1,1);
	response.end();
}).listen(81);

//choosing and giving back server's ip
http.createServer(function (request, response) {
    response.writeHead(200, {"Content-Type": "text/plain"});
   
	var alive_servers = [];
	total_players = 0;
	serverList.forEach(function(item, i, arr){
		total_players+=item.current_players;
		if (item.status == ServStatusEnum.UP){
			alive_servers.push(item);
		}
	});
	//console.log("total_players: "+total_players);
	//console.log("alive_servers: "+alive_servers.length);
	
	//uniform players distribution between active servers
	if (alive_servers.length!=0){
		index = Math.floor(Math.random()*alive_servers.length);
		response.write(alive_servers[index].host+":"+alive_servers[index].gamePort);
	}
	
	response.end();
}).listen(80);

// Check players count on server
function checkPlayers(server) {

	request({
	  uri: "http://"+server.host+":"+server.statsPort,
	  method: "GET",
	  timeout: 300
	}, function(error, response, body) {
		
	  if (typeof error != 'undefined'){
		//console.log(error);
		server.current_players=0;
		server.status = ServStatusEnum.DOWN;
		server.uptime = "";
	  }
	  
	  if (typeof body != 'undefined'){
		try{
			a=JSON.parse(body);
			//console.log(body);
			obj = JSON.parse(body);
			server.current_players=obj.current_players;
			server.max_players = obj.max_players;
			server.status = ServStatusEnum.UP;
			server.uptime = obj.uptime;
		}catch(e){
			server.current_players=0;
			server.status = ServStatusEnum.DOWN;
			server.uptime = "";
		}
	  }
	});
}
