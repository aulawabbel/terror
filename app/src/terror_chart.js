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

class TerrorChart {
    constructor(chart) {
        this.chart = chart;
    }
    setTimeScale(year, month) {
        if (month !== 'all') {
            this.chart.options.scales.xAxes[0].time.min = moment(year, "YYYY").month(month).startOf('month');
            this.chart.options.scales.xAxes[0].time.max = moment(year, "YYYY").month(month).endOf('month');
        } else {
            this.chart.options.scales.xAxes[0].time.min = moment(year, "YYYY").startOf('year');
            this.chart.options.scales.xAxes[0].time.max = moment(year, "YYYY").endOf('year');
        }

    }

    updateChart(year, month, country){
        var rows = Data.getRowsDict();
        fillMonths(rows.islamic.concat(rows.nonIslamic));
        fillCounties(rows.islamic.concat(rows.nonIslamic));

        var islamicRows = rows.islamic;
        var nonIslamicRows = rows.nonIslamic;

        islamicRows = Data.filterMonth(month, islamicRows);
        islamicRows = Data.filterCountry(country, islamicRows);

        var pattern = /(honor|suspected|moral|sexual|marrying|indecent)/i;
        var islamicSuspectedRows = Data.filterOnRegexp(pattern, islamicRows, false);

        islamicRows = Data.filterOnRegexp(pattern, islamicRows, true);

        nonIslamicRows = Data.filterMonth(month, nonIslamicRows);
        nonIslamicRows = Data.filterCountry(country, nonIslamicRows);

        var islamicData = this.getBubbleData(islamicRows, Data.COL.KILLS);
        var islamicSuspectedData = this.getBubbleData(islamicSuspectedRows, Data.COL.KILLS);
        var nonIslamicData = this.getBubbleData(nonIslamicRows, Data.COL.KILLS);

        var textInfo = " " + year;
        this.setTimeScale(year, month);
        if (month !== 'all') {
            textInfo += " " +  MONTHS[month];
        }
        if (country !== 'all') {
            textInfo += " " + utils.titleCase(country);
        }
        this.chart.options.title.text = ["Terror", textInfo];
        $('.statistics').text(textInfo + ' - ' + this.getStatisticsString(islamicRows, nonIslamicRows));

        barChartData.datasets[0].data = islamicData;
        barChartData.datasets[1].data = islamicSuspectedData;
        barChartData.datasets[2].data = nonIslamicData;
        this.chart.update();
    }

    getBubbleData(rows, col){
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
    getStatisticsString(islamicRows, nonIslamicRows) {
        var totKills = 0, totInjured = 0, totAttacks = 0;

        if (this.chart.isDatasetVisible(0)) {
            totAttacks += islamicRows.length;
            totKills += _math.sumBy(islamicRows, function(row) { return row[Data.COL.KILLS];} );
            totInjured += _math.sumBy(islamicRows, function(row) { return row[Data.COL.INJURED];} );
        }
        if (this.chart.isDatasetVisible(1)) {
            totAttacks += nonIslamicRows.length;
            totKills += _math.sumBy(nonIslamicRows, function(row) { return row[Data.COL.KILLS];} );
            totInjured += _math.sumBy(nonIslamicRows, function(row) { return row[Data.COL.INJURED];} );
        }

        var stats = "Attacks:" + totAttacks.toLocaleString();
        stats += " Killed:"  + totKills.toLocaleString();
        stats += " Injured:" + totInjured.toLocaleString();
        return stats;

    }

}

module.exports.TerrorChart = TerrorChart;
module.exports.barChartData = barChartData;

