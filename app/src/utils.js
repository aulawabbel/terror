var _core = require('lodash/core');
var queryString = require('query-string');

module.exports.wordWrapToStringList = function(text, maxLength) {
    var result = [], line = [];
    var length = 0;
    text.split(" ").forEach(function(word) {
        if ((length + word.length) >= maxLength) {
            result.push(line.join(" "));
            line = []; length = 0;
        }
        length += word.length + 1;
        line.push(word);
    });
    if (line.length > 0) {
        result.push(line.join(" "));
    }
    return result;
};

module.exports.sumIntArray = function(ints) {
    if (ints.length === 0) {
        return 0;
    }
    var sum = _core.reduce(ints, function(sum, val){
        return sum + val;
    });
    return sum;
};

module.exports.titleCase = function(str) {
    return str[0].toUpperCase() + str.substr(1);
};


/*
 * Parse the get parameters in the URL to an object
 *
 */
module.exports.urlParams = queryString.parse(location.search);

