/**
 * Created by Aulawabbel on 2016-08-06.
 */

var $ = require('jquery');
var _core = require('lodash/core');

var moment = require('moment');
// the row cols in the json data
var COL = {'DATE' : 0, 'COUNTY': 1, 'CITY' : 2, 'KILLS' : 3, 'INJURED' : 4, 'DESCRIPTION' : 5};

var LOADED_DATA = null;
var NON_ISLAMIC_LOADED_DATA = null;
var NON_ISLAMIC_LOADED_DATA_DATE_FILTRED = null;
var dataDict = {};
var load = function(year, callback) {
    // http://stackoverflow.com/questions/10004112/how-can-i-wait-for-set-of-asynchronous-callback-functions
    var promises = [];
    promises.push($.getJSON("data/terror_" + year + ".json", function (json) {
        LOADED_DATA = json.rows;
        convertDateColToMoment(LOADED_DATA, "YYYY.MM.DD");
    }));
    if (NON_ISLAMIC_LOADED_DATA === null){
        promises.push($.getJSON("data/non_islamic/non_islamist_terror.tab.json", function (json) {
            NON_ISLAMIC_LOADED_DATA = json.rows;
            convertDateColToMoment(NON_ISLAMIC_LOADED_DATA);
        }));

    }
    Promise.all(promises).then(function() {
        var startDate = moment(year, "YYYY");
        var endDate = moment(parseInt(year)+1, "YYYY");
        NON_ISLAMIC_LOADED_DATA_DATE_FILTRED = filterDate(startDate, endDate, NON_ISLAMIC_LOADED_DATA);
        dataDict = {
            'islamic': LOADED_DATA,
            'nonIslamic': NON_ISLAMIC_LOADED_DATA_DATE_FILTRED
        };
        callback(dataDict);

    }, function(err) {
        console.error("Failed to load data for year", year, "Error:", err);
    });
};

var convertDateColToMoment = function(rows, dateformat){
    /*
     As we only have day resolution this will also spread out rows with duplicate dates evenly on the day they occur on.
     */
    dateformat = dateformat ||"YYYY.MM.DD";
    var dateStr;
    var seen = {};
    _core.forEach(rows, function(row){
        dateStr = row[COL.DATE];
        if (dateStr in seen) {
            seen[dateStr]++;
        } else {
            seen[dateStr] = 1;
        }
    });
    var momentObj;
    dateStr = null;
    _core.forEach(rows, function(row){
        if (dateStr == row[COL.DATE]) {
            // duplicate move time forward
            momentObj = momentObj.clone().add(24/seen[dateStr], 'hour');
        } else {
            dateStr = row[COL.DATE];
            momentObj = moment(dateStr, dateformat);
        }
        row[COL.DATE] = momentObj;
    });


};

var filterMonth = function(month, rows) {
    if (month !== 'all'){
        month = parseInt(month);
        var myfilter = function(row) {
            var rowMonth = row[COL.DATE].month();
            if (rowMonth === month) {
                return true;
            } else {
                return false;
            }
        };
        rows = _core.filter(rows,  myfilter);
    }
    return rows;
};

var filterCountry = function(country, rows) {
    if (country !== 'all'){
        var myfilter = function(row) {
            if (row[COL.COUNTY].toLowerCase() === country) {
                return true;
            } else {
                return false;
            }
        };
        rows = _core.filter(rows,  myfilter);
    }
    return rows;

};
var filterDate = function(startDate, endDate, rows) {
    if (startDate && endDate){
        var myfilter = function(row) {
            if (startDate <= row[COL.DATE] && row[COL.DATE] <= endDate) {
                return true;
            } else {
                return false;
            }
        };
        rows = _core.filter(rows,  myfilter);
    }
    return rows;

};

var filterOnRegexp = function(regexp, rows, invert) {
    var match;
    var myfilter = function(row) {
        match = regexp.test(row[COL.DESCRIPTION]);
        if (invert === true) {
            return ! match;
        } else {
            return match;
        }
    };
    rows = _core.filter(rows,  myfilter);
    return rows;

};

module.exports.load = load;
module.exports.getRowsDict = function(){ return dataDict; };
module.exports.filterMonth = filterMonth;
module.exports.filterCountry = filterCountry;
module.exports.filterDate = filterDate;
module.exports.filterOnRegexp = filterOnRegexp;
module.exports.COL = COL;

