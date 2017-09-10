var http = require("http")
var fs = require("fs")
var path = require("path")
var srvList = require("./serversList")
var totals = require("./totalStats")

//show statistic in chart
http.createServer(function (request, response) {
    response.writeHead(200, {'Content-Type': 'text/html'});
    if (request.url.match('stats')) {
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.end(JSON.stringify(srvList.serverList.concat(totals.totalsFakeServer), (key,value) => key == "statistic" ? undefined : value ));
        return;
    }
    
    //since we are in a request handler function
    //we're using readFile instead of readFileSync
    fs.readFile(path.join(__dirname, './html/chart_template_update.html'), 'utf-8', function (err, content) {
        if (err) {
            response.end('error occurred' + err);
            return;
        }
        response.end(content);
    });
}).listen(83);

//show statistic in chart
http.createServer(function (request, response) {
    response.writeHead(200, {'Content-Type': 'text/html'});
    if (request.url.match('stats')) {
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.end(JSON.stringify(srvList.serverList.concat(totals.totalsFakeServer), (key,value) => key == "statisticUpdate" ? undefined : value ));
        return;
    }
    
    //since we are in a request handler function
    //we're using readFile instead of readFileSync
    fs.readFile(path.join(__dirname, './html/chart_template.html'), 'utf-8', function (err, content) {
        if (err) {
            response.end('error occurred' + err);
            return;
        }
        
        // var renderedHtml = ejs.render(content, {serverList: JSON.stringify(serverList, replacerForGraph)});  //get rendered HTML code
        // response.end(renderedHtml);
        response.end(content);
    });
}).listen(82);


http.createServer(function (request, response) {
    response.writeHead(200, {"Content-Type": "application/json"});
    var all = request.url.match('/all');
    var totalsData = totals.buildTotals()
    var data = srvList.serverList.concat(totalsData);
    if (!all) {
        data = data.filter(item => item.gamemode_api_id != 7); //filter TS2v2
    }
    response.end(JSON.stringify({Amazon: data}, require("./fieldFilter")));
}).listen(81);