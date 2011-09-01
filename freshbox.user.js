// ==UserScript==
// @name           Freshbox
// @namespace      http://bat-country.us/
// @include        *
// @require        http://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min.js
// @require        http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.1.6/underscore-min.js
// @resource       commonStyles https://github.com/SteelPangolin/GreaseMonkey/raw/master/commonStyles.css?1
// ==/UserScript==

String.prototype.startsWith = function(str)
{
    return this.slice(0, str.length) === str;
};

String.prototype.endsWith = function(str)
{
    return this.slice(-str.length) === str;
};

String.prototype.format = function()
{
    var re = /{(\d+)}/g;
    var sb = [];
    var match;
    var s = 0;
    while ((match = re.exec(this)))
    {
        sb.push(this.slice(s, match.index));
        s = re.lastIndex;
        sb.push(arguments[parseInt(match[1], 10)]);
    }
    sb.push(this.slice(s));
    return sb.join('');
};

function clamp(x, a, b)
{
    return Math.min(Math.max(x, a), b);
}

function wrap(x, a, b)
{
    var d = b - a;
    var m = (x - a) % d;
    if (m < 0)
    {
        m += d;
    }
    return m + a;
}

function lerp(x, a, b)
{
    return (1 - x) * a + x * b;
}

function interpolateAngle(x, a, b)
{
    if (a < b)
    {
        if (b - a < a + 2 * Math.PI - b)
        {
            z = lerp(x, a, b);
        }
        else
        {
            z = lerp(x, a + 2 * Math.PI, b);
        }
    }
    else
    {
        if (a - b < b + 2 * Math.PI - a)
        {
            z = lerp(x, a, b);
        }
        else
        {
            z = lerp(x, a, b + 2 * Math.PI);
        }
    }
    return wrap(z, 0, 2 * Math.PI);
}

function hsv2rgb(hsv)
{
    var h, s, v;
    [h, s, v] = hsv;
    var hPrime = 3 * h / Math.PI;
    var c = s * v;
    var x = c * (1 - Math.abs((hPrime % 2) - 1));
    var m = v - c;
    var r = m, g = m, b = m;
    switch (Math.floor(hPrime))
    {
    case 0:
        r += c;
        g += x;
        break;
    case 1:
        r += x;
        g += c;
        break;
    case 2:
        g += c;
        b += x;
        break;
    case 3:
        g += x;
        b += c;
        break;
    case 4:
        r += x;
        b += c;
        break;
    case 5:
        r += c;
        b += x;
        break;
    }
    return [r, g, b];
}

function rgb2hsv(rgb)
{
    var r, g, b;
    [r, g, b] = rgb;
    var M = _.max(rgb);
    var m = _.min(rgb);
    var c = M - m;
    var v = M;
    var s;
    if (M > 0)
    {
        s = c / v;
    }
    else
    {
        s = 0;
    }
    var hPrime;
    if (c === 0)
    {
        hPrime = 0;
    }
    else if (r === M)
    {
        hPrime = 0 + (g - b) / c;
    }
    else if (g === M)
    {
        hPrime = 2 + (b - r) / c;
    }
    else
    {
        hPrime = 4 + (r - g) / c;
    }
    var h = wrap(hPrime, 0, 6) * Math.PI / 3;
    return [h, s, v];
}

function interpolateHSV(x, hsv1, hsv2)
{
    var h1, s1, v1, h2, s2, v2;
    [h1, s1, v1] = hsv1;
    [h2, s2, v2] = hsv2;
    return [
        interpolateAngle(x, h1, h2),
        lerp(x, s1, s2),
        lerp(x, v1, v2)
    ];
}

function rgb2css(rgb)
{
    var sb = ['#'];
    for (var i = 0; i < 3; i++)
    {
        var x = Math.floor(rgb[i] * 0xff);
        if (x < 0x10) sb.push('0');
        sb.push(x.toString(16));
    }
    return sb.join('');
}

function css2rgb(css)
{
    var rgb = [];
    if (css.length === 4) // assume #xxx
    {
        for (var i = 1; i < 4; i++)
        {
            rgb.push(parseInt(css[i], 16) / 15.0);
        }
    }
    else // assume #xxxxxx
    {
        for (var i = 1; i < 7; i++)
        {
            rgb.push(parseInt(css.slice(i, i + 2), 16) / 255.0);
        }
    }
    return rgb;
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


// will try to parse ANY INTEGER
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

var stops = [
    {
        age_ms: 0,
        color: '#8c8',
    },
    {
        age_ms: timeUnits.month,
        color: '#cc8',
    },
    {
        age_ms: timeUnits.year,
        color: '#c88',
    },
    {
        age_ms: timeUnits.decade,
        color: '#88c',
    },
];
var veryOldItemColor = '#888';

function colorForDate(date)
{
    var age_ms = Math.max(0, Date.now() - date);
    var stopA, stopB = null;
    for (var i = 1; i < stops.length; i++)
    {
        if (stops[i].age_ms > age_ms)
        {
            stopA = stops[i - 1];
            stopB = stops[i];
            break;
        }
    }
    if (!stopB)
    {
        return veryOldItemColor;
    }
    var x = (age_ms - stopA.age_ms) / (stopB.age_ms - stopA.age_ms);
    return rgb2css(hsv2rgb(interpolateHSV(
        x,
        rgb2hsv(css2rgb(stopA.color)),
        rgb2hsv(css2rgb(stopB.color)))));
}

var datedItemTypes = [
    {
        desc: "Reddit post or comment",
        itemSelector: '.thing',
        dateSelector: 'time',
        dateAttr: 'datetime',
    },
    {
        desc: "Facebook post",
        itemSelector: '.uiUnifiedStory',
        dateSelector: 'abbr[data-date]',
        dateAttr: 'data-date',
        hiliteSelector: '.mainWrapper',
    },
    {
        desc: "Facebook comment",
        itemSelector: '.uiUfiComment',
        dateSelector: 'abbr[data-date]',
        dateAttr: 'data-date',
    },
    {
        // TODO: doesn't work
        desc: "G+ post",
        itemSelector: '.ke',
        dateSelector: '.Fl',
        dateAttr: 'title',
    },
    {
        // TODO: doesn't work
        desc: "G+ comment",
        itemSelector: '.zw',
        dateSelector: '.Fl',
        dateAttr: 'title',
    },
    {
        desc: "MDC wiki",
        itemSelector: '#content',
        dateSelector: '.last-mod a',
        dateAttr: 'title',
    },
    {
        desc: "CNN blog article",
        itemSelector: '.cnnPostWrap',
        dateSelector: '.cnnBlogContentDateHead',
    },
    {
        desc: "CNN blog comment",
        itemSelector: '.cnn_special_comment',
        dateSelector: '.commentFooter',
    },
    {
        desc: "Yahoo News article",
        itemSelector: '.yom-primary',
        dateSelector: '.byline abbr',
        dateAttr: 'title',
    },
    {
        desc: "Yahoo News comment",
        itemSelector: '.ugccmt-comment',
        dateSelector: '.ugccmt-timestamp abbr',
        dateAttr: 'title',
    },
    {
        desc: "StackOverflow question",
        itemSelector: '#question',
        dateSelector: '.user-action-time .relativetime',
        dateAttr: 'title',
    },
    {
        desc: "StackOverflow answer",
        itemSelector: '.answer',
        dateSelector: '.user-action-time .relativetime',
        dateAttr: 'title',
    },
    {
        desc: "StackOverflow comment",
        itemSelector: '.comment',
        dateSelector: '.comment-date',
        dateAttr: 'title',
    },
    {
        desc: "Amazon helpful review",
        itemSelector: '#customerReviews td > div',
        dateSelector: 'nobr',
    },
    {
        // TODO: doesn't work
        desc: "Amazon recent review",
        itemSelector: '#customerReviews td > div',
        dateSelector: '.tiny',
    },
    {
        desc: "Twitter",
        itemSelector: '.tweet',
        dateSelector: '._timestamp',
        dateAttr: 'data-time',
        dateParser: 'posixTimestamp',
    },
    {
        desc: "YouTube search results",
        itemSelector: '.result-item',
        dateSelector: '.date-added',
    },
    {
        desc: "YouTube video",
        itemSelector: 'body',
        dateSelector: '#eow-date',
        hiliteSelector: '#watch-headline',
    },
    {
        desc: "YouTube comment",
        itemSelector: '.comment-container',
        dateSelector: '.time',
    },
    {
        desc: "MediaWiki",
        itemSelector: 'body.mediawiki',
        dateSelector: '#footer-info-lastmod, #lastmod',
        hiliteSelector: '#content',
    },
    {
        desc: "MSDN blog post, comment",
        itemSelector: '.full-post',
        dateSelector: '.post-date .value',
    },
    {
        desc: "MSDN documentation comment",
        itemSelector: '.Annotation',
        dateSelector: '.AnnotationAddedContainer .AddedUserData',
    },
    {
        desc: "SomethingAwful Forums thread",
        itemSelector: '.thread',
        dateSelector: '.lastpost .date',
    },
    {
        desc: "SomethingAwful Forums post",
        itemSelector: '.post',
        dateSelector: '.postdate',
    },
    {
        desc: "Google result",
        itemSelector: '.vsc',
        dateSelector: 'span.f',
    },
    {
        desc: "Blogger post",
        itemSelector: '.date-outer',
        dateSelector: '.date-header span',
        hiliteSelector: '.post-body',
    },
    {
        desc: "Google Reader",
        itemSelector: '.entry',
        dateSelector: '.entry-date',
        hiliteSelector: '.card',
    },
    {
        desc: "Flickr photo",
        itemSelector: '#photo-story',
        dateSelector: '.ywa-track',
    },
    {
        desc: "Flickr comment",
        itemSelector: '.comment-block',
        dateSelector: '.comment-date a',
        dateAttr: 'title',
    },
    {
        desc: "Dropbox",
        itemSelector: '.browse-file-box-details',
        dateSelector: '.details-modified',
    },
];

function markDatedItems()
{
    for (var i = 0; i < datedItemTypes.length; i++)
    {
        var datedItemType = datedItemTypes[i];
        $(datedItemType.itemSelector).each(function (index, item)
        {
            try
            {
                var dateSource = $(item).find(datedItemType.dateSelector).first();
                if (dateSource.length === 0) return;
                var dateStr;
                if (!datedItemType.dateAttr)
                {
                    dateStr = dateSource.text();
                }
                else if (datedItemType.dateAttr.startsWith('data-'))
                {
                    dateStr = dateSource.data(datedItemType.dateAttr.slice(5));
                }
                else
                {
                    dateStr = dateSource.attr(datedItemType.dateAttr);
                }
                if (!dateStr) return;
                var date = specialDateParsers.hasOwnProperty(datedItemType.dateParser)
                    ? specialDateParsers[datedItemType.dateParser](dateStr)
                    : parseDate(dateStr);
                if (!date) return;
                var color = colorForDate(date);
                var hilite = datedItemType.hiliteSelector
                    ? $(item).find(datedItemType.hiliteSelector).first()
                    : $(item);
                dateSource.css('border', '2px dotted {0}'.format(color));
                hilite.css('box-shadow', 'inset 3px 3px 3px {0}'.format(color));
            }
            catch (exception)
            {
                // pass
            }
        });
    }
}

if (window.top == window.self)
{
    GM_addStyle(GM_getResourceText('commonStyles'));
    $(document)
        .bind('DOMNodeInserted', _.debounce(markDatedItems, 200))
        .ready(markDatedItems);
}