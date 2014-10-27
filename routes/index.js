var Async = require('async'); // An async helper library
var ScraperLib = require('../lib'); // Our functions to scrape the various parts of the site

/**
 * Our one and only route handler
 * @param  {Hapi.Request} request Our request object
 * @param  {Hapy.Reply}   reply   Our reply object
 */
module.exports.grabSomeHeadlines = function(request, reply) {
	// Use the waterfall flow to pass values from one
	// function to the next
	Async.waterfall([
		ScraperLib.downloadHomepage,
		ScraperLib.parseCategories,
		ScraperLib.downloadAndParseCategoryPages,
	], function(err, results) {
		reply(results);
	});
};

