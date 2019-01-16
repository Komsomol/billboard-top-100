// REQUIRES

var request = require('request');
var cheerio = require('cheerio');

// CONSTANTS

var CHARTS_BASE_URL = 'http://www.billboard.com/charts/';

// IMPLEMENTATION FUNCTIONS

/**
 * Creates a new title-cased string from the given string
 * From: https://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript
 *
 * @param {string} str - The string to be title-cased
 * @return {string} The title-cased string
 *
 * @example
 * 
 *     toTitleCase("hello woRld") // "Hello World"
 */
function toTitleCase(str) {
    return str.replace(/\w\S*/g, function strToReplaceWith(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

/**
 * Gets the title from the specified chart item
 *
 * @param {HTMLElement} chartItem - The chart item
 * @return {string} The title
 *
 * @example
 * 
 *     getTitleFromChartItem(<div class="chart-list-item">...</div>) // 'The Real Slim Shady'
 */
function getTitleFromChartItem(chartItem) {
	var title;
	try {
		title = chartItem.children[1].children[5].children[1].children[1].children[1].children[0].data.replace(/\n/g, '');
	} catch (e) {
		title = '';
	}
	return title;
} 

/**
 * Gets the artist from the specified chart item
 *
 * @param {HTMLElement} chartItem - The chart item
 * @return {string} The artist
 *
 * @example
 * 
 *     getArtistFromChartItem(<div class="chart-list-item">...</div>) // 'Eminem'
 */
function getArtistFromChartItem(chartItem) {
	var artist;
	try {
		artist = chartItem.children[1].children[5].children[1].children[3].children[0].data.replace(/\n/g, '');
	} catch (e) {
		artist = '';
	}
	if (artist.trim().length < 1) {
		try {
			artist = chartItem.children[1].children[5].children[1].children[3].children[1].children[0].data.replace(/\n/g, '');
		} catch (e) {
			artist = '';
		}
	}
	return artist;
} 

/**
 * Gets the cover from the specified chart item
 *
 * @param {HTMLElement} chartItem - The chart item
 * @param {number} rank - The rank of the chart item
 * @return {string} The cover url string
 *
 * @example
 * 
 *     getCoverFromChartItem(<div class="chart-list-item">...</div>) // 'https://charts-static.billboard.com/img/2016/12/locash-53x53.jpg'
 */
function getCoverFromChartItem(chartItem, rank) {
	var cover;
	try {
		if (rank == 1) {
			cover = chartItem[0].children[1].attribs.src;
		} else {
			cover = chartItem.children[1].children[3].children[3].attribs['data-src'];
		}
	} catch (e) {
		cover = '';
	}
	return cover;
} 

/**
 * Gets the position last week from the specified chart item
 *
 * @param {HTMLElement} chartItem - The chart item
 * @return {number} The position last week
 *
 * @example
 * 
 *     getPositionLastWeekFromChartItem(<div class="chart-list-item">...</div>) // 4
 */
function getPositionLastWeekFromChartItem(chartItem) {
	var positionLastWeek;
	try {
		positionLastWeek = chartItem.children[3].children[3].children[1].children[3].children[0].data;
	} catch (e) {
		positionLastWeek = '';
	}
	return parseInt(positionLastWeek);
} 

/**
 * Gets the peak position from the specified chart item
 *
 * @param {HTMLElement} chartItem - The chart item
 * @return {number} The peak position
 *
 * @example
 * 
 *     getPeakPositionFromChartItem(<div class="chart-list-item">...</div>) // 4
 */
function getPeakPositionFromChartItem(chartItem) {
	var peakPosition;
	try {
		peakPosition = chartItem.children[3].children[3].children[3].children[3].children[0].data;
	} catch (e) {
		peakPosition = '';
	}
	return parseInt(peakPosition);
} 

/**
 * Gets the weeks on chart last week from the specified chart item
 *
 * @param {HTMLElement} chartItem - The chart item
 * @return {number} The weeks on chart
 *
 * @example
 * 
 *     getWeeksOnChartFromChartItem(<div class="chart-list-item">...</div>) // 4
 */
function getWeeksOnChartFromChartItem(chartItem) {
	var weeksOnChart;
	try {
		weeksOnChart = chartItem.children[3].children[3].children[5].children[3].children[0].data;
	} catch (e) {
		weeksOnChart = '';
	}
	return parseInt(weeksOnChart);
} 

/**
 * Gets information for specified chart and date
 *
 * @param {string} chart - The specified chart
 * @param {string} date - Date represented as string in format 'YYYY-MM-DD'
 * @param {function} cb - The specified callback method
 *
 * @example
 * 
 *     getChart('hot-100', '2016-08-27', function(err, songs) {...})
 */
function getChart(chart, date, cb) {
	// check if date was specified
	if (typeof date === 'function'){
		// if date not specified, default to current chart for current week, 
		// and set callback method accordingly
		cb = date;
		date = '';
	}
	/**
	 * A song
	 * @typedef {Object} Song
	 * @property {string} title - The title of the song
	 * @property {string} artist - The song's artist
	 */

	/**
	 * Array of songs
	 */
	var songs = [];
	// build request URL string for specified chart and date
	var requestURL = CHARTS_BASE_URL + chart + "/" + date;
	request(requestURL, function completedRequest(error, response, html) {
		if (error) {
			cb(error, null);
			return;
		}
		var $ = cheerio.load(html);
		// push #1 ranked song into songs array (formatted differently from following songs)
		songs.push({
			"rank": 1,
			"title": $('.chart-number-one__details').children('.chart-number-one__title').text().trim(),
			"artist": $('.chart-number-one__details').children('.chart-number-one__artist').text().trim(),
			"cover": getCoverFromChartItem($('.chart-number-one__image-wrapper'), 1),
	        "position" : {
	          "positionLastWeek": parseInt($('.chart-number-one__stats-cell--bordered').children('.chart-number-one__last-week').text().trim()),
	          "peakPosition": 1,
	          "weeksOnChart": parseInt($('.chart-number-one__stats-cell--bordered').children('.chart-number-one__weeks-on-chart').text().trim())
	        }
		});
		// push remaining ranked songs into songs array
		$('.chart-list-item').each(function(index, item) {
			var rank = index + 2;
			songs.push({
				"rank": rank,
				"title": getTitleFromChartItem(item),
				"artist": getArtistFromChartItem(item),
				"cover": getCoverFromChartItem(item, rank),
				"position" : {
					"positionLastWeek": getPositionLastWeekFromChartItem(item),
					"peakPosition": getPeakPositionFromChartItem(item),
					"weeksOnChart": getWeeksOnChartFromChartItem(item)
				}
			});
		});
		// callback with songs if songs array was populated
		if (songs.length > 1){
			cb(null, songs);
			return;
		} else {
			cb("Songs not found.", null);
			return;
		}
	});

}

/**
 * Gets all charts available via Billboard
 *
 * @param {string} chart - The specified chart
 * @param {string} date - Date represented as string in format 'YYYY-MM-DD'
 * @param {function} cb - The specified callback method
 *
 * @example
 * 
 *     listCharts(function(err, charts) {...})
 */
function listCharts(cb) {
	if (typeof cb !== 'function') {
		cb('Specified callback is not a function.', null);
		return;
	}
	request(CHARTS_BASE_URL, function completedRequest(error, response, html) {
		if (error) {
			cb(error, null);
			return;
		}
		var $ = cheerio.load(html);
		/**
		 * A chart
		 * @typedef {Object} Chart
		 * @property {string} name - The name of the chart
		 * @property {string} url - The url of the chat
		 */

		/**
		 * Array of charts
		 */
		var charts = [];
		// push charts into charts array
		$('.chart-panel__link').each(function(index, item) {
			var chart = {};
			chart.name = toTitleCase($(this)[0].attribs.href.replace('/charts/', '').replace(/-/g, ' '));
			chart.url = "https://www.billboard.com/charts" + $(this)[0].attribs.href;
			charts.push(chart);
		});
		// callback with charts if charts array was populated
		if (charts.length > 0){
			cb(null, charts);
			return;
		} else {
			cb("No charts found.", null);
			return;
		}
	});
}

// export getChart and listCharts functions
module.exports = {
	getChart,
	listCharts
}
