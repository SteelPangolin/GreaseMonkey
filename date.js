
var months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];

var monthGroupPat = function()
{
    var sb = [];
    sb.push('(');
    for (var i = 0; i < months.length; i++)
    {
        if (i > 0) sb.push('|');
        var month = months[i];
        sb.push(month.substring(0, 3));
        if (month.length > 3)
        {
            sb.push('(?:');
            sb.push(month.substring(3));
            sb.push(')?');
        }
    }
    sb.push(')');
    return sb.join('');
}();

function lookupMonth(month)
{
    var mon = month.substring(0, 3).toLowerCase();
    for (var i = 0; i < months.length; i++)
    {
        if (mon === months[i].substring(0, 3).toLowerCase()) return i;
    }
    return null; // bad input
}

function isValidYear(y)
{
    return 1970 <= y && y <= 2038;
}

function isValidMonth(m)
{
    return 0 <= m && m <= 11;
}

function isValidDay(d)
{
    return 1 <= d && d <= 31;
}

var yearFirstRE = /\b(\d{4})([\/.-])(\d{1,2})\2(\d{1,2})(?:\b|T)/i; // YYYY-MM-DD, YYYY/DD/MM
function parseYearFirstDate(str)
{
    var match = yearFirstRE.exec(str);
    if (!match) return null;
    var m = parseInt(match[3], 10) - 1;
    var y = parseInt(match[1], 10);
    var d = parseInt(match[4], 10);
    return parseDateUnknownMMDDOrder(y, m, d);
}

var yearLastRE = /\b(\d{1,2})([\/.-])(\d{1,2})\2(\d{4})\b/i; // MM/DD/YYYY, DD-MM-YYYY
function parseYearLastDate(str)
{
    var match = yearLastRE.exec(str);
    if (!match) return null;
    var m = parseInt(match[1], 10) - 1;
    var d = parseInt(match[3], 10);
    var y = parseInt(match[4], 10);
    return parseDateUnknownMMDDOrder(y, m, d);
}

function parseDateUnknownMMDDOrder(y, m, d)
{
    if (!isValidYear(y)) return null;
    if (!(isValidMonth(m) && isValidDay(d)))
    {
        var t = m;
        m = d;
        d = t;
    }
    if (!(isValidMonth(m) && isValidDay(d))) return null;
    return new Date(y, m, d);
}

var mdyLongDateRE = new RegExp('\\b' + monthGroupPat + '.? (\\d{1,2})(?:st|nd|rd|th)?,? (\\d{4})\\b', 'i'); // Mon. DDst, YYYY
function parseMDYLongDate(str)
{
    var match = mdyLongDateRE.exec(str);
    if (!match) return null;
    var m = lookupMonth(match[1]);
    if (m === null) return null;
    var d = parseInt(match[2], 10);
    if (!isValidDay(d)) return null;
    var y = parseInt(match[3], 10);
    if (!isValidYear(y)) return null;
    return new Date(y, m, d);
}

var dmyLongDateRE = new RegExp('\\b(\\d{1,2})(?:st|nd|rd|th)? ' + monthGroupPat + '.?,? (\\d{4})\\b', 'i'); // DDst Month, YYYY
function parseDMYLongDate(str)
{
    var match = dmyLongDateRE.exec(str);
    if (!match) return null;
    var d = parseInt(match[1], 10);
    if (!isValidDay(d)) return null;
    var m = lookupMonth(match[2]);
    if (m === null) return null;
    var y = parseInt(match[3], 10);
    if (!isValidYear(y)) return null;
    return new Date(y, m, d);
}

/**
 * Will return a value for any non-negative integer, not suitable for free-text parsing.
 */
function parsePosixTimestamp(str)
{
    return new Date(parseInt(str, 10));
}

var timeUnits = {
    second: 1000,
    minute: 60 * 1000,
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000,
    decade: 10 * 365 * 24 * 60 * 60 * 1000,
};

var timeUnitsGroupPat = function()
{
    var sb = [];
    for (var unit in timeUnits)
    {
        if (!timeUnits.hasOwnProperty(unit)) continue;
        sb.push(unit + 's?');
    }
    return '(' + sb.join('|') + ')';
}();

var relativeDateRE = new RegExp('\\b(\\d+) ' + timeUnitsGroupPat + ' ago\\b', 'i');
function parseRelativeDate(str)
{
    var match = relativeDateRE.exec(str);
    if (!match) return null;
    var count = parseInt(match[1], 10);
    var unit = match[2].toLowerCase();
    if (unit.endsWith('s')) unit = unit.slice(0, -1);
    return new Date(Date.now() - count * timeUnits[unit]);
}

var yesterdayRE = new RegExp('\\byesterday\\b', 'i');
function parseYesterday(str)
{
    var match = yesterdayRE.exec(str);
    if (!match) return null;
    return new Date(Date.now() - timeUnits.day);
}

var dateParsers = [
    parseYearFirstDate,
    parseYearLastDate,
    parseMDYLongDate,
    parseDMYLongDate,
    parseRelativeDate,
    parseYesterday,
];
function parseDate(str)
{
    for (var i = 0; i < dateParsers.length; i++)
    {
        var date = dateParsers[i](str);
        if (date !== null) return date;
    }
    return null;
}

var specialDateParsers = {
    posixTimestamp: parsePosixTimestamp
};