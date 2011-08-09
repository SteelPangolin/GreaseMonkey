// ==UserScript==
// @name           Freshbox
// @namespace      http://bat-country.us/
// @include        *
// @require        http://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min.js
// ==/UserScript==

var showDateSource = true;
var showRelativeDate = true;
var allowGoogleFallback = true;

var siteSpecializations = [
    {
        re: /^https?:\/\/(?:www\.)?reddit\.com\//,
        handler: redditFindPageDate
    },
    {
        re: /^https?:\/\/forums\.somethingawful\.com\/showthread\.php/,
        handler: saforumsThreadFindPageDate
    },
    {
        re: /^https?:\/\/forums\.somethingawful\.com\/forumdisplay\.php/,
        handler: saforumsForumFindPageDate
    }
];

function redditFindPageDate()
{
    // if a post's link info box is available, use that
    var linkinfoJQ = $('.linkinfo');
    if (linkinfoJQ.size())
    {
        var linkinfo = linkinfoJQ.get(0);
        return dateInfoFromElem(
            parseDate(linkinfo.childNodes[0].textContent),
            'Reddit (post info)',
            linkinfo);
    }
    // otherwise, use most recently submitted time in content div
    return dateInfoFromNewest(
        $('.content time[datetime]'),
        function(elem) { return elem.attributes['datetime'].value },
        'Reddit (newest post on page)');
}

function saforumsThreadFindPageDate()
{
    var postdate = $('.postdate').get(-1);
    return dateInfoFromElem(
        parseDate(postdate.textContent),
        'SomethingAwful Forums (newest post on page)',
        postdate);
}

function saforumsForumFindPageDate()
{
    return dateInfoFromNewest(
        $('.date'),
        function(elem) { return elem.textContent },
        'SomethingAwful Forums (newest thread on page)');
}

function dateInfoFromNewest(elems, extractDateString, text)
{
    if (elems.jquery) elems = elems.toArray();
    var newestDateElem = elems[0];
    var newestDate = parseDate(extractDateString(newestDateElem));
    GM_log(newestDateElem);
    for (var i = 1; i < elems.length; i++)
    {
        var elem = elems[i];
        var date = parseDate(extractDateString(elem));
        if (date > newestDate)
        {
            newestDate = date;
            newestDateElem = elem;
        }
    }
    return dateInfoFromElem(newestDate, text, newestDateElem);
}

function getLastModifedFromGoogle(callback, failureCallback)
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
                if (date)
                {
                    callback({
                        date: date,
                        text: "Google",
                        url: queryUrl});
                }
                else
                {
                    failureCallback();
                }
            }
            catch (e) {}
        }
    });
}

function showGoogleLookupButton()
{
    $('#freshbox')
        .addClass('freshbox_deferred')
        .append('<input id="freshbox_lookupBtn" type="button" value="Get date from Google"></input>')
        .removeClass('freshbox_hidden');
    $('#freshbox_lookupBtn')
        .click(function(event) {
            $(this).hide();
            getLastModifedFromGoogle(displayFreshbox, closeFreshbox);
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

function dateInfoFromElem(date, text, elem)
{
    var url;
    if (!elem)
    {
        url = '#';
    }
    else
    {
        if (!elem.id) // give the element an id if it doesn't have one
        {
            elem.id = Math.random();
        }
        url = '#' + encodeURIComponent(elem.id);
    }
    return {
        date: date,
        text: text,
        url: url
    };
}

function xpath(expr, node, doc)
{
    if (!node) node = document;
    if (!doc) doc = document;
    var snapshot = doc.evaluate(expr, node, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    var nodes = [];
    for (var i = 0; i < snapshot.snapshotLength; i++)
    {
        nodes.push(snapshot.snapshotItem(i));
    }
    return nodes;
}

function findPageDate()
{
    var date = parseDate(document.URL);
    if (date)
    {
        return dateInfoFromElem(date, 'document URL', null);
    }
    
    var timeElems = xpath('//time[@datetime]');
    for (var i = 0; i < timeElems.length; i++)
    {
        var elem = timeElems[i];
        var date = parseDate(elem.attributes['datetime'].value);
        if (!date) continue;
        return dateInfoFromElem(date, 'time element', elem.parentElem);
    }
    
    var titleAttrElems = xpath('//*[@title]');
    for (var i = 0; i < titleAttrElems.length; i++)
    {
        var elem = titleAttrElems[i];
        var date = parseDate(elem.attributes['title'].value);
        if (!date) continue;
        return dateInfoFromElem(date, 'title attribute', elem);
    }
    
    var textNodes = xpath('//text()');
    for (var i = 0; i < textNodes.length; i++)
    {
        var node = textNodes[i];
        if (!(node instanceof Text)) continue;
        var date = parseDate(node.data);
        if (!date) continue;
        return dateInfoFromElem(date, 'document text', node.parentNode);
    }
    
    return null;
}

var freshboxStyle = "\
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
\
#freshbox_close {\
    float: right;\
    margin-left: 0.5em;\
}\
\
.freshbox_hidden {\
    display: none;\
}\
\
.freshbox_pastWeek {\
    background-color: #BAF349;\
    color: #719E18;\
}\
\
.freshbox_pastWeek a,\
.freshbox_pastWeek a:active,\
.freshbox_pastWeek a:visited,\
.freshbox_pastWeek a:hover {\
    color: #719E18;\
}\
\
.freshbox_pastMonth {\
    background-color: #FFDA73;\
    color: #A67A00;\
}\
\
.freshbox_pastMonth a,\
.freshbox_pastMonth a:active,\
.freshbox_pastMonth a:visited,\
.freshbox_pastMonth a:hover {\
    color: #A67A00;\
}\
\
.freshbox_pastYear {\
    background-color: #FFD383;\
    color: #FF9900;\
}\
\
.freshbox_pastYear a,\
.freshbox_pastYear a:active,\
.freshbox_pastYear a:visited,\
.freshbox_pastYear a:hover {\
    color: #FF9900;\
}\
\
.freshbox_old {\
    background-color: #FFB4B1;\
    color: #FF392F;\
}\
\
.freshbox_old a,\
.freshbox_old a:active,\
.freshbox_old a:visited,\
.freshbox_old a:hover {\
    color: #FF392F;\
}\
\
.freshbox_deferred {\
\
    background-color: #E4EDF7;\
    color: #336699;\
}\
\
.freshbox_deferred a,\
.freshbox_deferred a:active,\
.freshbox_deferred a:visited,\
.freshbox_deferred a:hover {\
    color: #336699;\
}\
";

function displayFreshbox(dateInfo)
{
    var today = new Date();
    var ageInDays = Math.floor((today - dateInfo.date) / (24 * 60 * 60 * 1000));
    if (ageInDays < 0)
    {
        // happens because we currently ignore time and timezone info
        ageInDays = 0;
    }
    var freshnessClass;
    var unitName;
    var unitDays;
    if (ageInDays < 7)
    {
        freshnessClass = 'freshbox_pastWeek';
        unitName = "day";
        unitDays = 1;
    }
    else if (ageInDays < 30)
    {
        freshnessClass = 'freshbox_pastMonth';
        unitName = "week";
        unitDays = 7;
    }
    else if (ageInDays < 365)
    {
        freshnessClass = 'freshbox_pastYear';
        unitName = "month";
        unitDays = 30;
    }
    else
    {
        freshnessClass = 'freshbox_old';
        unitName = "year";
        unitDays = 365;
    }
    units = Math.floor(ageInDays / unitDays);
    var dateString;
    if (showRelativeDate)
    {
        dateString = units + " " + unitName + (units === 1 ? "" : "s") + " old";
    }
    else
    {
        dateString = dateInfo.date.toDateString();
    }
    $('#freshbox')
        .append(dateString)
        .addClass(freshnessClass)
        .removeClass('freshbox_deferred')
        .removeClass('freshbox_hidden');
    if (showDateSource)
    {
        $('#freshbox').append('<br/><a id="#freshbox_source" href="' + dateInfo.url + '">' + dateInfo.text + '</a>');
    }
}

function closeFreshbox() {
    $('#freshbox').fadeOut('fast');
}

if (window.top == window.self)
{
    GM_addStyle(freshboxStyle);
    $(document).ready(function()
    {
        $('body').append('<div id="freshbox" class="freshbox_hidden"><div id="freshbox_close">&#x2716;</div></div>');
        $('#freshbox_close').click(closeFreshbox);
        var dateInfo = null;
        for (var i = 0; i < siteSpecializations.length; i++)
        {
            var site = siteSpecializations[i];
            var match = site.re.test(document.URL);
            if (match)
            {
                try // allow site-specific handlers to fail in case a site changes
                {
                    dateInfo = site.handler();
                }
                catch (e) {}
                break;
            }
        }
        if (!dateInfo)
        {
            dateInfo = findPageDate();
        }
        if (dateInfo)
        {
            displayFreshbox(dateInfo);
        }
        else if (allowGoogleFallback)
        {
            showGoogleLookupButton();
        }
    });
}