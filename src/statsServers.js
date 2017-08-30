var http = require("http")
var fs = require("fs")
var path = require("path")
var serverList = require("./serversList").serverList
var totals = require("./totalStats")

//show statistic in chart
http.createServer(function (request, response) {
    response.writeHead(200, {'Content-Type': 'text/html'});
    if (request.url.match('stats')) {
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.write(JSON.stringify(serverList, (key,value) => key == "statistic" ? undefined : value ));
        response.end();
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
        serverList.push(totals.totalsFakeServer);
        response.write(JSON.stringify(serverList, (key,value) => 
        key == "statisticUpdate" ? undefined : value ));
        serverList.splice(serverList.length - 1, 1);
        response.end();
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
    serverList.push(totals.buildTotals());
    response.end(JSON.stringify([{Amazon: serverList}], require("./fieldFilter")));
    //deleting temporary objects
    serverList.splice(serverList.length - 1, 1);
}).listen(81);