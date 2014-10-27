// Load up the dependencies
var Hapi = require('hapi'); // Our server framework
var RoutesLib = require('./routes'); // Our routes

// Create the server
var server = new Hapi.createServer(process.env.HOST || 'localhost', process.env.PORT || 9001, {cors: true, debug: {request:['error']}});

// Set up the route(s)
server.route([
	{ method: 'GET', path: '/', handler: RoutesLib.grabSomeHeadlines }
]);

// Start listening!
server.start(function() {
	console.log('Server started and running at ' + server.info.uri);
});