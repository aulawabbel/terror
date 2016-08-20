var $ = require('jquery');
var moment = require('moment');
var _core = require('lodash/core');
var _array = require('lodash/array');
var _math = require('lodash/math');
var Chart = require("chart.js");
var Data = require('./terror_data');
var utils = require('./utils');

var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
var globals = {};

// TODO: Animation Idea: http://jsbin.com/yitep/5/edit?html,js,output
//Chart.pluginService.register(
//    {
//    'beforeUpdate': function(chartInstance) {
//        updateChart(globals.year, globals.month, globals.country);
//        }
//    }
//);

window.onload = function() {
    var ctx = document.getElementById("canvas").getContext("2d");
    window.myCart = new Chart(ctx, {
        type: 'bubble',
        data: barChartData,
        options: {
            title: {
                display: true,
                text: 'Terror...',
                fontSize: 16
            },
            responsive: true,
            maintainAspectRatio: true,
            legend: {
                position: 'top'
            },
            scales: {
                xAxes: [{
                    type: 'time',
                    time: {unit: 'month'},
                    scaleLabel: {
                        display: true,
                        labelString: 'Date'
                    }
                }],
                yAxes: [{
                    type: 'logarithmic',
                    scaleLabel: {
                        display: true,
                        labelString: 'Killed'
                    },
                    ticks: {
                        min: 1,
                        maxTicksLimit: 10,
                        callback: function (numericalTick, index, ticks) {
                            // as this is the log value and we start with 2 to get one on the scale.
                            return numericalTick - 1;
                        }
                    }
                }]
            },
            tooltips: {
                mode: 'single',
                callbacks: {
                    title: function(tooltipItems, data) {
                        return getRowFromToolTipData(tooltipItems[0],data)[Data.COL.DATE].format("YYYY-MM-DD");

                    },
                    afterTitle: function(tooltipItems, data) {
                        return [
                            getRowFromToolTipData(tooltipItems[0],data)[Data.COL.COUNTY],
                            getRowFromToolTipData(tooltipItems[0],data)[Data.COL.CITY]
                        ];

                    },
                    label : function(tooltip, data){
                        var row = getRowFromToolTipData(tooltip, data);
                        var dataset = data.datasets[tooltip.datasetIndex];
                        value = "Killed: " + dataset.data[tooltip.index].value;
                        value += " Injured: " + row[Data.COL.INJURED];
                        return value;
                    },
                    afterBody: function(tooltipItems, data) {
                        var row = getRowFromToolTipData(tooltipItems[0], data);
                        return utils.wordWrapToStringList(row[Data.COL.DESCRIPTION], 60);

                    }
                }
            }
        }
    });
    var getRowFromToolTipData = function(tooltip, data) {
        var dataset = data.datasets[tooltip.datasetIndex];
        var row = dataset.data[tooltip.index].rowData;
        return row;

    };
    // initialize with selected years data.
    var year = $('#select_year').val();
    Data.load(year, function(){
        var rows = Data.getRowsDict();
        var months = _core.map(rows.islamic, function(row) {
            return row[Data.COL.DATE].month();
        });
        months = _array.uniq(months);
        var country = 'all';
        // show the most recent month
        month = _core.max(months);
        updateChart(year, month, country);
        $('#select_month').val(month);

    });


};

var barChartData = {
    labels: [],
    datasets: [{
        hidden: false,
        label: 'Islamic',
        borderColor: 'rgb(255, 0, 0, 1.0)',
        backgroundColor: "rgba(220,0,0,0.5)",
        data: []
    }, {
        hidden: false,
        label: 'Suspected or "Honor"',
        borderColor: 'rgb(0, 225, 0, 0.7)',
        backgroundColor: "rgba(0, 255, 0,0.5)",
        data: []
    }, {
        hidden: false,
        label: 'Non Islamic',
        borderColor: 'rgb(0, 0, 255, 0.7)',
        backgroundColor: "rgba(0,0,220,0.5)",
        data: []
    },]

};


var updateChart = function (year, month, country){
    var rows = Data.getRowsDict();
    fillMonths(rows.islamic.concat(rows.nonIslamic));
    fillCounties(rows.islamic.concat(rows.nonIslamic));

    var islamicRows = rows.islamic;
    var nonIslamicRows = rows.nonIslamic;

    islamicRows = Data.filterMonth(month, islamicRows);
    islamicRows = Data.filterCountry(country, islamicRows);

    var pattern = /(honor|suspected|moral|sexual|marrying)/i;
    var islamicSuspectedRows = Data.filterOnRegexp(pattern, islamicRows, false);

    islamicRows = Data.filterOnRegexp(pattern, islamicRows, true);

    nonIslamicRows = Data.filterMonth(month, nonIslamicRows);
    nonIslamicRows = Data.filterCountry(country, nonIslamicRows);

    var islamicData = getBubbleData(islamicRows, Data.COL.KILLS);
    var islamicSuspectedData = getBubbleData(islamicSuspectedRows, Data.COL.KILLS);
    var nonIslamicData = getBubbleData(nonIslamicRows, Data.COL.KILLS);

    var textInfo = " " + year;
    setTimeScale(year, month);
    if (month !== 'all') {
        textInfo += " " +  MONTHS[month];
    }
    if (country !== 'all') {
        textInfo += " " + utils.titleCase(country);
    }

    window.myCart.options.title.text = ["Terror", textInfo];
    $('.statistics').text(textInfo + ' - ' + getStatisticsString(islamicRows, nonIslamicRows));

    barChartData.datasets[0].data = islamicData;
    barChartData.datasets[1].data = islamicSuspectedData;
    barChartData.datasets[2].data = nonIslamicData;
    window.myCart.update();
};

var setTimeScale = function(year, month) {
    if (month !== 'all') {
        window.myCart.options.scales.xAxes[0].time.min = moment(year, "YYYY").month(month).startOf('month');
        window.myCart.options.scales.xAxes[0].time.max = moment(year, "YYYY").month(month).endOf('month');
    } else {
        window.myCart.options.scales.xAxes[0].time.min = moment(year, "YYYY").startOf('year');
        window.myCart.options.scales.xAxes[0].time.max = moment(year, "YYYY").endOf('year');
    }

};

var getBubbleData = function(rows, col){
    var radius;
    var valueForLog;
    var minRadius = 3;
    return _core.map(rows, function(row) {
        // as log 0 is infinity make sure we start at 1 (log(1) == 0).
        valueForLog = row[col] + 1;
        // Make the circles area proportional to amount
        radius = Math.sqrt(row[col]*2 / Math.PI) * 3;
        radius = Math.max(minRadius,radius);

        return {
            rowData: row,
            value : row[col],
            x : row[Data.COL.DATE],
            y : valueForLog,
            r : radius
        };
    });

};

var getStatisticsString = function(islamicRows, nonIslamicRows) {
    var totKills = 0, totInjured = 0, totAttacks = 0;

    if (window.myCart.isDatasetVisible(0)) {
        totAttacks += islamicRows.length;
        totKills += _math.sumBy(islamicRows, function(row) { return row[Data.COL.KILLS];} );
        totInjured += _math.sumBy(islamicRows, function(row) { return row[Data.COL.INJURED];} );
    }
    if (window.myCart.isDatasetVisible(1)) {
        totAttacks += nonIslamicRows.length;
        totKills += _math.sumBy(nonIslamicRows, function(row) { return row[Data.COL.KILLS];} );
        totInjured += _math.sumBy(nonIslamicRows, function(row) { return row[Data.COL.INJURED];} );
    }

    var stats = "Attacks:" + totAttacks.toLocaleString();
    stats += " Killed:"  + totKills.toLocaleString();
    stats += " Injured:" + totInjured.toLocaleString();
    return stats;

};

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
            text : MONTHS[month]
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

var updateChartWithSelectboxVals = function(){
    var year = $('#select_year').val();
    var month = $('#select_month').val();
    var country = $('#select_country').val();
    globals.year = year;
    globals.month = month;
    globals.country = country;
    updateChart(year, month, country);

};