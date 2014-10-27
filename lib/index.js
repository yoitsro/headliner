var Async = require('async'); // An async helper library
var Cheerio = require('cheerio'); // Our DOM parser
var Hapi = require('hapi'); // Our server framework
var Request = require('request'); // A little client to help us grab data

var internals = {};

/**
 * Downloads the homepage
 * @param  {Function} next The callback
 */
module.exports.downloadHomepage = function(next) {
	Request.get('http://www.bbc.co.uk/news', next);
};

/**
 * Parses the response from the homepage request and
 * returns a callback with an array of categories.
 * @param  {Object}   response The response object from Request
 * @param  {String}   body     The response string as HTML
 * @param  {Function} next     The callback
 */
module.exports.parseCategories = function(response, body, next) {
	if (response.statusCode > 400) {
		return next(new Hapi.Error('Uh oh! I couldn\'t get the BBC homepage.'))
	}

	var $ = Cheerio.load(body);

	var categories = [];

	$('div#blq-local-nav ul#nav li a').each(function() {
		var category = {};
		category.url = $(this).attr('href');
		category.title = $(this).text();
		category.stories = [];

		categories.push(category);
	});

	next(null, categories);
};

/**
 * A wrapper around Async.mapLimit which calls downloadAndParseCategoryPage
 * @param  {Array}   	categories 	The array of category objects
 * @param  {Function} 	next       	The callback containing the complete array of
 *                                 	category objects
 */
module.exports.downloadAndParseCategoryPages = function(categories, next) {
	Async.mapLimit(categories, 20, internals.downloadAndParseCategoryPage, next)
};

/**
 * Downloads the category page
 * @param  {Object}   category The category object
 * @param  {Function} next     The callback containing a category object
 */
internals.downloadAndParseCategoryPage = function(category, next) {
	// Ensure we're using an absolute URL
	if (category.url.indexOf('bbc.co.uk') === -1) {
		category.url = 'http://www.bbc.co.uk' + category.url;
	}

	console.log('info: Downloading ' + category.url);

	Request.get(category.url, function(err, response, body) {
		if (err) {
			return next(err);
		}

		if (response.statusCode > 400) {
			return next(new Hapi.Error('Uh oh! I couldn\'t get a BBC category page.'))
		}

		category.stories = internals.parseHeadlines(body);
		return next(null, category);
	});
};

/**
 * Takes the html of a category page and parses the headlines from it
 * @param  {String} body The HTML of the page
 * @return {Array}      An array of headline objects
 */
internals.parseHeadlines = function(body) {
	var headlines = [];

	var $ = Cheerio.load(body);

	$('div.container-top-stories > div#top-story, div.container-top-stories > div.secondary-top-story').each(function() {
		var story = {};

		story.title = $(this).find('h2 a').text();
		story.title = story.title ? story.title.trim() : story.title;

		story.url = $(this).find('h2 a').attr('href');
		story.url = story.url.indexOf('bbc.co.uk') === -1 ? 'http://www.bbc.co.uk' + story.url : story.url;
		
		story.image = $(this).find('img').attr('src');

		headlines.push(story);
	});

	return headlines;
};