var $ = require('jquery');
var moment = require('moment');
var _core = require('lodash/core');
var _array = require('lodash/array');
var Chart = require("chart.js");
var Data = require('./terror_data');
var utils = require('./utils');
var terrorChartModule = require('./terror_chart');

var globals = {};

// TODO: Animation Idea: http://jsbin.com/yitep/5/edit?html,js,output
//Chart.pluginService.register(
//    {
//    'beforeUpdate': function(chartInstance) {
//        updateChart(globals.year, globals.month, globals.country);
//        }
//    }
//);

var terrorChartWrapper;
window.onload = function() {
    var ctx = document.getElementById("canvas").getContext("2d");
    var terrorChart = new Chart(ctx, {
        type: 'bubble',
        data: terrorChartModule.barChartData,
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
                        var value = "Killed: " + dataset.data[tooltip.index].value;
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

    terrorChartWrapper = new terrorChartModule.TerrorChart(terrorChart);
    var getRowFromToolTipData = function(tooltip, data) {
        var dataset = data.datasets[tooltip.datasetIndex];
        var row = dataset.data[tooltip.index].rowData;
        return row;

    };

    var params = utils.urlParams;
    // initialize with selected years data.
    var year = params.year || $('#select_year').val();
    Data.load(year, function(){
        var rows = Data.getRowsDict();
        var months = _core.map(rows.islamic, function(row) {
            return row[Data.COL.DATE].month();
        });
        months = _array.uniq(months);
        var country = params.country || 'all';
        var month;
        if (params.month) {
            if (params.month == "all") {
                month = params.month;
            } else {
                // month is zero based in the code.
                month = params.month - 1;

            }

        } else {
            // show the most recent month if not given
            month = _core.max(months);

        }
        month = month;
        terrorChartWrapper.updateChart(year, month, country);
        updateDirectLink(year, month, country);

        // update the select boxes to reflect the shown data.
        $('#select_year').val(year);
        $('#select_month').val(month);
        $('#select_country').val(country);

    });


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
    terrorChartWrapper.updateChart(year, month, country);
    updateDirectLink(year, month, country);

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