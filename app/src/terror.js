var $ = require('jquery');
var moment = require('moment');
var _core = require('lodash/core');
var _array = require('lodash/array');
var Data = require('./terror_data');
var utils = require('./utils');
var terrorChartModule = require('./terror_chart');

// TODO: Animation Idea: http://jsbin.com/yitep/5/edit?html,js,output


var terrorChartWrapper;
window.onload = function() {
    var ctx = document.getElementById("canvas").getContext("2d");
    terrorChartWrapper = new terrorChartModule.TerrorChart(ctx);

    // initialize with selected years data.
    var year = utils.urlParams.year || $('#select_year').val();
    Data.load(year, function(rowsData){
        var month = getInitialMonth(utils.urlParams.month);
        var country = utils.urlParams.country || 'all';

        updateChart(year, month, country, rowsData);

        // update the select boxes to reflect the shown data.
        $('#select_year').val(year);
        $('#select_month').val(month);
        $('#select_country').val(country);

    });

};

var getInitialMonth = function(monthVal) {
    /*
     * Get the index of month (starting from 0) to initialize the chart with.
     * If monthVal is set use that (this value is should 1-based and can also be string "all".
     * If monthVal is not given or undefined return latest month that data is available for.
     */

    var monthIndex;
    if (monthVal !== undefined) {
        if (monthVal == "all") {
            monthIndex = monthVal;
        } else {
            // month is zero based in the code.
            monthIndex = monthVal - 1;
        }
    } else {
        // show the most recent month that has data
        var rows = Data.getRowsDict();
        var months = _core.map(rows.islamic, function(row) {
            return row[Data.COL.DATE].month();
        });
        months = _array.uniq(months);
        monthIndex = _core.max(months);
    }
    return monthIndex;
};

var updateChart = function(year, month, country, rowsData) {
    /** Update the chart and rest of page that is dependent on these values.
     * if rowsData is given then also update the chart with that, else reuse the last set data.
     */
    rowsData = rowsData || terrorChartWrapper.getData();
    console.log("updateChart", rowsData, year, month, country);
    if (rowsData !== undefined) {
        terrorChartWrapper.setData(rowsData);
    }
    terrorChartWrapper.updateChart(year, month, country);
    fillMonths(rowsData.islamic.concat(rowsData.nonIslamic));
    fillCounties(rowsData.islamic.concat(rowsData.nonIslamic));
    updateDirectLink(year, month, country);


};

Chart.pluginService.register(
    {
        'afterUpdate': function(chartInstance) {
            /*
            Ugly way to update the statistics if data shown changes,
            Need to do this here to trigger on enable/disable datasets on chart legend.
             */
            if (terrorChartWrapper !== undefined) {
                $('.statistics').text(terrorChartWrapper.getStatisticsString());

            }
        }
    }
);

var fillCounties = function(data){
    var select = $('#select_country') || 'all';
    var selected = select.val();
    var countries = _core.map(data, function(row) {
        return row[Data.COL.COUNTY].toLowerCase();
    });
    if (selected != 'all') {
        // we want to keep the selected country even is it has no enteries for loaded period.
        countries.push(selected);
    }
    countries = _array.uniq(countries);
    countries = _core.sortBy(countries);

    select.empty();
    select.append($('<option/>', {
        value: 'all',
        text : 'All Countries'
    }));
    _core.forEach(countries, function(country) {
        select.append($('<option/>', {
            value: country,
            text : utils.titleCase(country)
        }));
    });
    select.val(selected);
};

var fillMonths = function(data){
    var select = $('#select_month');
    var selected = select.val() || 'all';
    var months = _core.map(data, function(row) {
        return row[Data.COL.DATE].month();
    });

    months = _array.uniq(months);

    select.empty();
    select.append($('<option/>', {
        value: 'all',
        text : 'All Months'
    }));
    _core.forEach(months, function(month) {
        select.append($('<option/>', {
            value: month,
            text : terrorChartModule.MONTHS[month]
        }));
    });
    select.val(selected);
    if (select.val() === null){
        select.val('all');
    }
};

$(document).on('change', '#select_year', function(){
    // http://stackoverflow.com/questions/15805000/jquery-change-event-callback
    Data.load($('#select_year').val(), updateChartWithSelectboxVals);
});

$(document).on('change', '#select_month', function(){
    updateChartWithSelectboxVals();
});

$(document).on('change', '#select_country', function(){
    updateChartWithSelectboxVals();
});

var updateChartWithSelectboxVals = function(rowsData){
    var year = $('#select_year').val();
    var month = $('#select_month').val();
    var country = $('#select_country').val();
    updateChart(year, month, country, rowsData);

};

var updateDirectLink = function(year, month, country) {
    var urlParams = "";
    urlParams += "year=" + year;
    if (month == "all") {
        urlParams += "&month=" + month;
    } else {
        urlParams += "&month=" + (parseInt(month) + 1);

    }
    urlParams += "&country=" + country;
    $('#directlink').attr("href", "./?" + urlParams);

};