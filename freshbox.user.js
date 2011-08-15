// ==UserScript==
// @name           Freshbox
// @namespace      http://bat-country.us/
// @include        *
// @require        http://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min.js
// @resource       commonStyles https://https://github.com/SteelPangolin/GreaseMonkey/raw/master/commonStyles.css?1
// ==/UserScript==

var showDateSource = false;
var showRelativeDate = true;
var allowGoogleFallback = true;

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
    if (!date) return null;
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

function dateInfoFromNewest(elems, extractDateString, text)
{
    if (elems.jquery) elems = elems.toArray();
    var newestDateElem = elems[0];
    var newestDate = parseDate(extractDateString(newestDateElem));
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

function dateInfoFromFirst(elems, extractDateString, text)
{
    if (elems.jquery) elems = elems.toArray();
    return dateInfoFromElem(parseDate(extractDateString(elems[0])), text, elems[0]);
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

function getTextContent(elem) {
    return elem.textContent;
}

function getDateInfo_documentURL()
{
    return dateInfoFromElem(parseDate(document.URL), 'document URL', null);
}

function getDateInfo_time()
{
    var timeElems = xpath('//time[@datetime]');
    for (var i = 0; i < timeElems.length; i++)
    {
        var elem = timeElems[i];
        var date = parseDate(elem.attributes['datetime'].value);
        if (!date) continue;
        return dateInfoFromElem(date, 'time element', elem.parentElem);
    }
    return null;
}

function getDateInfo_title()
{
    var titleAttrElems = xpath('//*[@title]');
    for (var i = 0; i < titleAttrElems.length; i++)
    {
        var elem = titleAttrElems[i];
        var date = parseDate(elem.attributes['title'].value);
        if (!date) continue;
        return dateInfoFromElem(date, 'title attribute', elem);
    }
    return null;
}

function getDateInfo_text()
{
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

function getDateInfo_reddit()
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
        function(elem) { return elem.attributes['datetime'].value; },
        'Reddit (newest post on page)');
}

function getDateInfo_saforumsThread()
{
    var postdate = $('.postdate').get(-1);
    return dateInfoFromElem(
        parseDate(postdate.textContent),
        'SomethingAwful Forums (newest post on page)',
        postdate);
}

function getDateInfo_saforumsForum()
{
    return dateInfoFromNewest(
        $('.date'),
        getTextContent,
        'SomethingAwful Forums (newest thread on page)');
}

var mediawikiLastmodSelectors = [
    '#footer-info-lastmod',
    '#lastmod'
];
function getDateInfo_mediawiki()
{
    for (var i = 0; i < mediawikiLastmodSelectors.length; i++)
    {
        var lastmod = $(mediawikiLastmodSelectors[i]);
        if (lastmod.size())
        {
            return dateInfoFromFirst(
                lastmod,
                getTextContent,
                'MediaWiki last modified date');
        }
    }
    return null;
}

var extractors = [
    {
        re: /^https?:\/\/(?:www\.)?reddit\.com\//,
        getDateInfo: getDateInfo_reddit
    },
    {
        re: /^https?:\/\/forums\.somethingawful\.com\/showthread\.php/,
        getDateInfo: getDateInfo_saforumsThread
    },
    {
        re: /^https?:\/\/forums\.somethingawful\.com\/forumdisplay\.php/,
        getDateInfo: getDateInfo_saforumsForum
    },
    {
        getDateInfo: getDateInfo_mediawiki
    },
    {
        getDateInfo: getDateInfo_documentURL
    },
    {
        getDateInfo: getDateInfo_time
    },
    {
        getDateInfo: getDateInfo_title
    },
    {
        getDateInfo: getDateInfo_text
    }
];

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

function closeFreshbox()
{
    $('#freshbox').fadeOut('fast');
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

if (window.top == window.self)
{
    GM_addStyle(GM_getResourceText('commonStyles'));
    $(document).ready(function()
    {
        $('body').append('<div id="freshbox" class="freshbox_hidden"><div id="freshbox_close">&#x2716;</div></div>');
        $('#freshbox_close').click(closeFreshbox);
        var dateInfo = null;
        for (var i = 0; i < extractors.length; i++)
        {
            var extractor = extractors[i];
            if (!extractor.re || extractor.re.test(document.URL))
            {
                try
                {
                    dateInfo = extractor.getDateInfo();
                    if (dateInfo) break;
                }
                catch (e) {}
            }
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