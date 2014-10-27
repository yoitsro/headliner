var Async = require('async'); // An async helper library
var Hoek = require('hoek'); // A helper library
var ScraperLib = require('../lib'); // Our functions to scrape the various parts of the site

/**
 * Our one and only route handler
 * @param  {Hapi.Request} request Our request object
 * @param  {Hapy.Reply}   reply   Our reply object
 */
module.exports.grabSomeHeadlines = function(request, reply) {
	Async.waterfall([
		ScraperLib.downloadHomepage,
		ScraperLib.parseCategories,
		ScraperLib.downloadCategoryPages,
	], function(err, results) {
		reply(results);
	});
};

