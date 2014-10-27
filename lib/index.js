var Async = require('async'); // An async helper library
var Cheerio = require('cheerio');
var Hapi = require('hapi'); // Our server framework
var Request = require('request'); // A little client to help us grab data

var internals = {};

module.exports.downloadHomepage = function(next) {
	Request.get('http://www.bbc.co.uk/news', next);
};

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

module.exports.downloadCategoryPages = function(categories, next) {
	Async.mapLimit(categories, 20, internals.downloadAndParseCategoryPage, next)
};

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