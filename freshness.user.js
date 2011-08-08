// ==UserScript==
// @name           Freshness
// @namespace      http://bat-country.us/
// @include        *
// @require        http://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min.js
// ==/UserScript==

var showDateSource = false;
var allowGoogleFallback = true;

function getLastModifedFromGoogle(callback)
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
                var date = parseDate(dateString);
                callback(date, 'Google', queryUrl);
            }
            catch (e) {}
        }
    });
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
        if (mon === months[i].substring(0, 3).toLowerCase()) return i;
    }
    return null; // bad input
}

function isValidYear(y)
{
    return 1990 <= y && y <= 2020;
}

function isValidMonth(m)
{
    return 0 <= m && m <= 11;
}

function isValidDay(d)
{
    return 1 <= d && d <= 31;
}

var date1RE = /\b(\d{4})([\/.-])(\d{2})\2(\d{2})(?:\b|T)/i; // YYYY-MM-DD, YYYY/DD/MM
function parseDate1(str)
{
    var match = date1RE.exec(str);
    if (!match) return null;
    var m = parseInt(match[3], 10) - 1;
    var y = parseInt(match[1], 10);
    var d = parseInt(match[4], 10);
    return parseDateUnknownMMDDOrder(y, m, d);
}

var date2RE = /\b(\d{2})([\/.-])(\d{2})\2(\d{4})\b/i; // MM/DD/YYYY, DD-MM-YYYY
function parseDate2(str)
{
    var match = date2RE.exec(str);
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

function findPageDate(callback)
{
    var date = parseDate(document.URL);
    if (date)
    {
        callback(date, 'document URL', '#');
        return;
    }
    
    var timeNodes = document.evaluate('//time[@datetime]', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i = 0; i < timeNodes.snapshotLength; i++)
    {
        var node = timeNodes.snapshotItem(i);
        var text = node.attributes['datetime'].value;
        var date = parseDate(text);
        if (!date) continue;
        if (!node.parentNode.id)
        {
            node.parentNode.id = Math.random();
        }
        callback(date, 'time element', '#' + encodeURIComponent(node.parentNode.id));
        return;
    }
    
    var titleAttrNodes = document.evaluate('//*[@title]', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i = 0; i < titleAttrNodes.snapshotLength; i++)
    {
        var node = titleAttrNodes.snapshotItem(i);
        var text = node.attributes['title'].value;
        var date = parseDate(text);
        if (!date) continue;
        if (!node.id)
        {
            node.id = Math.random();
        }
        callback(date, 'title attribute', '#' + encodeURIComponent(node.id));
        return;
    }
    
    var textNodes = document.evaluate('//text()', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i = 0; i < textNodes.snapshotLength; i++)
    {
        var node = textNodes.snapshotItem(i);
        if (!(node instanceof Text)) continue;
        var text = node.data.trim();
        if (!text) continue;
        var date = parseDate(text);
        if (!date) continue;
        if (!node.id)
        {
            node.id = Math.random();
        }
        callback(date, 'document text', '#' + encodeURIComponent(node.id));
        return;
    }
    
    if (allowGoogleFallback)
    {
        getLastModifedFromGoogle(callback);
    }
}

var pastWeekStyle = "\
#freshbox {\
    background-color: #BAF349;\
    color: #719E18;\
}\
\
#freshbox a,\
#freshbox a:active,\
#freshbox a:visited,\
#freshbox a:hover {\
    color: #719E18;\
}\
";

var pastMonthStyle = "\
#freshbox {\
    background-color: #FFDA73;\
    color: #A67A00;\
}\
\
#freshbox a,\
#freshbox a:active,\
#freshbox a:visited,\
#freshbox a:hover {\
    color: #A67A00;\
}\
";

var pastYearStyle = "\
#freshbox {\
    background-color: #FFD383;\
    color: #FF9900;\
}\
\
#freshbox a,\
#freshbox a:active,\
#freshbox a:visited,\
#freshbox a:hover {\
    color: #FF9900;\
}\
";

var oldStyle = "\
#freshbox {\
    background-color: #FFB4B1;\
    color: #FF392F;\
}\
\
#freshbox a,\
#freshbox a:active,\
#freshbox a:visited,\
#freshbox a:hover {\
    color: #FF392F;\
}\
";

function styleFreshbox(date)
{
    var today = Date.now();
    var ageInDays = (today - date) / (24 * 60 * 60 * 1000);
    if (ageInDays < 7) GM_addStyle(pastWeekStyle);
    else if (ageInDays < 30) GM_addStyle(pastMonthStyle);
    else if (ageInDays < 365) GM_addStyle(pastYearStyle);
    else GM_addStyle(oldStyle);
}

function displayFreshbox(date, sourceText, sourceURL)
{
    $('body').append('<div id="freshbox">' + date.toDateString() + ' &#x2716;</div>');
    if (showDateSource)
    {
        $('#freshbox').append('<br/><a id="#freshbox_source" href="' + sourceURL + '">' + sourceText + '</a>');
    }
    $('#freshbox').click(function() { $(this).fadeOut('fast') });
}

function displayDate(date, sourceText, sourceURL)
{
    styleFreshbox(date);
    displayFreshbox(date, sourceText, sourceURL);
}

if (window.top == window.self)
{
    GM_addStyle("\
    #freshbox {\
        position: absolute;\
        top: 10px;\
        left: 10px;\
        border-radius: 5px;\
        padding: 5px;\
        z-index: 1000;\
        box-shadow: 3px 3px 2px #aaaaaa;\
    }\
    \
    #freshbox a,\
    #freshbox a:active,\
    #freshbox a:visited,\
    #freshbox a:hover {\
        text-decoration: underline;\
    }\
    ");
    
    $(document).ready(function()
    {
        findPageDate(displayDate);
    });
}