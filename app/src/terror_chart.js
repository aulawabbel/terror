/*jshint esversion: 6 */
var $ = require('jquery');
var moment = require('moment');
var _core = require('lodash/core');
var _object = require('lodash/object');
var _math = require('lodash/math');
var Data = require('./terror_data');
var utils = require('./utils');
var Chart = require("chart.js");

var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];


var createChart = function(ctx) {

    var terrorChart = new Chart(ctx, {
        type: 'bubble',
        data: chartData,
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
    /**
     * Get the incident data assosiated with a specific tooltip (where user clicked)
     * @param tooltip
     * @param data
     * @returns a the underlying incident data array for the asked tooltip.
     */
    var getRowFromToolTipData = function(tooltip, data) {
        var dataset = data.datasets[tooltip.datasetIndex];
        var row = dataset.data[tooltip.index].rowData;
        return row;

    };
    return terrorChart;
};

var dataSetIndexes = {
    islamic : 0,
    islamicSuspected : 1,
    nonIslamic : 2
};

var chartData = {
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
    }]

};

/**
 * Wrapper around the chart object provide handling of it in a nicer way.
 */
class TerrorChart {
    constructor(ctx) {
        this.chart = createChart(ctx);
        this.rowsData = null;
    }
    setData(rowsData) {
        this.rowsData = rowsData;
    }
    getData() {
        return this.rowsData;
    }
    updateChart(year, month, country){
        console.assert(this.rowsData, "The data has not been initialized for the Terror chart", this);
        this.filtredData = this._filterData(year, month, country);
        this.filtredData = filterAndMoveSuspectedAndHonor(this.filtredData);

        var islamicData = this._getBubbleData(this.filtredData.islamic, Data.COL.KILLS);
        var islamicSuspectedData = this._getBubbleData(this.filtredData.islamicSuspected, Data.COL.KILLS);
        var nonIslamicData = this._getBubbleData(this.filtredData.nonIslamic, Data.COL.KILLS);

        chartData.datasets[dataSetIndexes.islamic].data = islamicData;
        chartData.datasets[dataSetIndexes.islamicSuspected].data = islamicSuspectedData;
        chartData.datasets[dataSetIndexes.nonIslamic].data = nonIslamicData;
        this._setTimeScale(year, month);
        this.chart.options.title.text = ["Terror", getTitleText(year, month, country)];
        this.chart.update();


    }
    /**
     * This function takes the full data and filters out the relevant period and country (for every property on object).
     * @param data
     * @param year
     * @param month
     * @param country
     * @returns new data object with all filtered data
     */
    _filterData(year, month, country){
        var filtredData = {};
        _object.forOwn(this.rowsData, function(rows, key) {
            rows = Data.filterMonth(month, rows);
            rows = Data.filterCountry(country, rows);
            filtredData[key] = rows;

        });
        return filtredData;
    }

    _getBubbleData(rows, col){
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

    }
    _setTimeScale(year, month) {
        if (month !== 'all') {
            this.chart.options.scales.xAxes[0].time.min = moment(year, "YYYY").month(month).startOf('month');
            this.chart.options.scales.xAxes[0].time.max = moment(year, "YYYY").month(month).endOf('month');
        } else {
            this.chart.options.scales.xAxes[0].time.min = moment(year, "YYYY").startOf('year');
            this.chart.options.scales.xAxes[0].time.max = moment(year, "YYYY").endOf('year');
        }

    }
    getTitleText() {
        return this.chart.options.title.text;
    }
    getStatisticsString() {
        var totKills = 0, totInjured = 0, totAttacks = 0;
        var _this = this;
        _object.forOwn(dataSetIndexes, function(dataSetIndex, key) {
            if (_this.chart.isDatasetVisible(dataSetIndex)) {
                var data = chartData.datasets[dataSetIndex].data;
                totAttacks += data.length;
                totKills += _math.sumBy(data, item => item.rowData[Data.COL.KILLS]);
                totInjured += _math.sumBy(data, item => item.rowData[Data.COL.INJURED]);
            }

        });

        var stats = "Attacks:" + totAttacks.toLocaleString();
        stats += " Killed:"  + totKills.toLocaleString();
        stats += " Injured:" + totInjured.toLocaleString();
        return stats;

    }

}

var getTitleText = function(year, month, country) {
    var textInfo = " " + year;
    if (month !== 'all') {
        textInfo += " " +  MONTHS[month];
    }
    if (country !== 'all') {
        textInfo += " " + utils.titleCase(country);
    }
    return textInfo;
};


/**
 * This filters and moves out the suspected and "honor" islamic attacks to it's own property "islamicSuspected".
 * @param data
 * @returns {{islamic, islamicSuspected: *, nonIslamic: *}}
 */
var filterAndMoveSuspectedAndHonor = function(data){
    var islamic = data.islamic;
    var nonIslamic = data.nonIslamic;

    var pattern = /(honor|suspected|moral|sexual|marrying|indecent)/i;
    var islamicSuspected = Data.filterOnRegexp(pattern, islamic, false);

    islamic = Data.filterOnRegexp(pattern, islamic, true);
    return {
        islamic : islamic,
        islamicSuspected : islamicSuspected,
        nonIslamic : nonIslamic
    };
};

module.exports.TerrorChart = TerrorChart;
module.exports.MONTHS = MONTHS;
module.exports.getTitleText = getTitleText;

