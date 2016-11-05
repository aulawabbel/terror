/*jshint esversion: 6 */
var $ = require('jquery');
var moment = require('moment');
var _core = require('lodash/core');
var _array = require('lodash/array');
var _math = require('lodash/math');
var Data = require('./terror_data');
var utils = require('./utils');

var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

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
/**
 * Wrapper around the chart object provide handling of it in a nicer way.
 */
class TerrorChart {
    constructor(chart) {
        this.chart = chart;
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
        this.filtredData = filterData(this.rowsData, year, month, country);

        var islamicData = this._getBubbleData(this.filtredData.islamicRows, Data.COL.KILLS);
        var islamicSuspectedData = this._getBubbleData(this.filtredData.islamicSuspectedRows, Data.COL.KILLS);
        var nonIslamicData = this._getBubbleData(this.filtredData.nonIslamicRows, Data.COL.KILLS);

        barChartData.datasets[0].data = islamicData;
        barChartData.datasets[1].data = islamicSuspectedData;
        barChartData.datasets[2].data = nonIslamicData;
        this._setTimeScale(year, month);
        this.chart.update();

        this.chart.options.title.text = ["Terror", getTitleText(year, month, country)];

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

    getStatisticsString() {
        var totKills = 0, totInjured = 0, totAttacks = 0;

        if (this.chart.isDatasetVisible(0)) {
            totAttacks += this.filtredData.islamicRows.length;
            totKills += _math.sumBy(this.filtredData.islamicRows, function(row) { return row[Data.COL.KILLS];} );
            totInjured += _math.sumBy(this.filtredData.islamicRows, function(row) { return row[Data.COL.INJURED];} );
        }
        if (this.chart.isDatasetVisible(1)) {
            totAttacks += this.filtredData.nonIslamicRows.length;
            totKills += _math.sumBy(this.filtredData.nonIslamicRows, function(row) { return row[Data.COL.KILLS];} );
            totInjured += _math.sumBy(this.filtredData.nonIslamicRows, function(row) { return row[Data.COL.INJURED];} );
        }

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

var filterData = function(rowsData, year, month, country){
    console.log("filterData", rowsData, year, month, country);
    rowsData = rowsData;
    var islamicRows = rowsData.islamic;
    var nonIslamicRows = rowsData.nonIslamic;

    islamicRows = Data.filterMonth(month, islamicRows);
    islamicRows = Data.filterCountry(country, islamicRows);

    var pattern = /(honor|suspected|moral|sexual|marrying|indecent)/i;
    var islamicSuspectedRows = Data.filterOnRegexp(pattern, islamicRows, false);

    islamicRows = Data.filterOnRegexp(pattern, islamicRows, true);

    nonIslamicRows = Data.filterMonth(month, nonIslamicRows);
    nonIslamicRows = Data.filterCountry(country, nonIslamicRows);
    return {
        islamicRows : islamicRows,
        islamicSuspectedRows : islamicSuspectedRows,
        nonIslamicRows : nonIslamicRows
    };
};
module.exports.TerrorChart = TerrorChart;
module.exports.barChartData = barChartData;
module.exports.MONTHS = MONTHS;
module.exports.getTitleText = getTitleText;

