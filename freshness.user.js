// ==UserScript==
// @name           Freshness
// @namespace      http://bat-country.us/
// @include        *
// @require        http://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min.js
// ==/UserScript==

function getLastModifedFromGoogle(url, callback)
{
    var queryUrl = 'http://www.google.com/search?q=inurl:' + encodeURIComponent(document.URL) + '&as_qdr=y15';
    GM_xmlhttpRequest({
        method: 'GET',
        url: queryUrl,
        onload: function(response)
        {
            var range = document.createRange();
            var frag = range.createContextualFragment(response.responseText);
            var doc = document.implementation.createHTMLDocument(null);
            doc.adoptNode(frag);
            doc.documentElement.appendChild(frag);
            try {
                var dateString = $('li.g', doc).first().find('span.f').get(0).textContent;
                callback(dateString, 'Google', queryUrl);
            }
            catch (e) {}
        }
    });
}

function displayFreshnessText(text, source, sourceUrl)
{
    $('body').append('<div id="freshbox">' + text + ' &#x2716;<br/><a href="' + sourceUrl + '">' + source + '</a></div>');
    $('#freshbox').click(function() { $(this).fadeOut('fast') });
}

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
    var chunks = [];
    chunks.push('(');
    for (var i = 0; i < months.length; i++)
    {
        if (i > 0) chunks.push('|');
        var month = months[i];
        chunks.push(month.substring(0, 3));
        if (month.length > 3)
        {
            chunks.push('(?:');
            chunks.push(month.substring(3));
            chunks.push(')?');
        }
    }
    chunks.push(')');
    return chunks.join('');
}();

function lookupMonth(month)
{
    var mon = month.substring(0, 3).toLowerCase();
    for (var i = 0; i < months.length; i++)
    {
        if (mon === months[i].substring(0, 3).toLowerCase()) return (i + 1);
    }
    return null; // bad input
}

function isValidYear(y)
{
    return 1990 <= y && y <= 2020;
}

function isValidMonth(m)
{
    return 1 <= m && m <= 12;
}

function isValidDay(d)
{
    return 1 <= d && d <= 31;
}

var date1RE = /\b(\d{4})([\/.-])(\d{2})\2(\d{2})\b/i; // YYYY-MM-DD, YYYY/DD/MM
function parseDate1(str)
{
    var match = date1RE.exec(str);
    if (!match) return null;
    var y = parseInt(match[1], 10);
    var m = parseInt(match[3], 10);
    var d = parseInt(match[4], 10);
    return parseDateUnknownMMDDOrder(y, m, d);
}

var date2RE = /\b(\d{2})([\/.-])(\d{2})\2(\d{4})\b/i; // MM/DD/YYYY, DD-MM-YYYY
function parseDate2(str)
{
    var match = date2RE.exec(str);
    if (!match) return null;
    var m = parseInt(match[1], 10);
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

var date3RE = new RegExp('\\b' + monthGroupPat + '.? (\\d{1,2})(?:st|nd|rd|th)?,? (\\d{4})\\b', 'i'); // Mon. DDst, YYYY
function parseDate3(str)
{
    var match = date3RE.exec(str);
    if (!match) return null;
    var m = lookupMonth(match[1]);
    if (m === null) return null;
    var d = parseInt(match[2], 10);
    if (!isValidDay(d)) return null;
    var y = parseInt(match[3], 10);
    if (!isValidYear(y)) return null;
    return new Date(y, m, d);
}

var date4RE = new RegExp('\\b(\\d{1,2})(?:st|nd|rd|th)? ' + monthGroupPat + '.?,? (\\d{4})\\b', 'i'); // DDst Month, YYYY
function parseDate4(str)
{
    var match = date4RE.exec(str);
    if (!match) return null;
    var d = parseInt(match[1], 10);
    if (!isValidDay(d)) return null;
    var m = lookupMonth(match[2]);
    if (m === null) return null;
    var y = parseInt(match[3], 10);
    if (!isValidYear(y)) return null;
    return new Date(y, m, d);
}

var dateParsers = [parseDate1, parseDate2, parseDate3, parseDate4];
function parseDate(str)
{
    for (var i = 0; i < dateParsers.length; i++)
    {
        var date = dateParsers[i](str);
        if (date !== null) return date;
    }
    return null;
}

function markDates()
{
    var nodes = document.evaluate('//text()', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i = 0; i < nodes.snapshotLength; i++)
    {
        var node = nodes.snapshotItem(i);
        if (!(node instanceof Text)) continue;
        var text = node.data.trim();
        if (!text) continue;
        var date = parseDate(text);
        if (!date) continue;
        node.parentNode.style.backgroundColor = colorAge(date);
    }
}

function colorAge(date)
{
    var today = Date.now();
    var ageInDays = (today - date) / (24 * 60 * 60 * 1000);
    if (ageInDays < 7) return '#ccffcc';
    else if (ageInDays < 30) return '#ffffcc';
    else return '#ffcccc';
}

GM_addStyle("\
#freshbox {\
    position: absolute;\
    top: 10px;\
    left: 10px;\
    border-radius: 3px;\
    border: 3px #FFBC00 solid;\
    color: #FFDA73;\
    background-color: #A67A00;\
    padding: 3px;\
    z-index: 1000;\
}\
\
#freshbox a,\
#freshbox a:active,\
#freshbox a:visited,\
#freshbox a:hover {\
    color: #FFDA73;\
    text-decoration: underline;\
}\
");

$(document).ready(function()
{
    //getLastModifedFromGoogle(document.URL, displayFreshnessText);
    //displayFreshnessText(new Date(document.lastModified), 'document.lastModified<br/>', '#');
    markDates();
});