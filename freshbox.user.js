// ==UserScript==
// @name           Freshbox
// @namespace      http://bat-country.us/
// @include        *
// @require        http://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min.js
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

function colorForDate(date)
{
    if (date === null)
    {
        return '#88c';
    }
    var today = new Date();
    var ageInDays = Math.floor((today - date) / (24 * 60 * 60 * 1000));
    if (ageInDays < 0)
    {
        // happens because we currently ignore time and timezone info
        ageInDays = 0;
    }
    if (ageInDays <= 1)
    {
        return '#8c8';
    }
    else if (ageInDays <= 7)
    {
        return '#cc8';
    }
    else
    {
        return '#c88';
    }
}

var datedItemTypes = [
    { // Reddit post or comment
        itemSelector: '.thing',
        dateSelector: 'time',
        dateAttr: 'datetime'
    },
    { // Facebook post
        itemSelector: '.uiUnifiedStory',
        dateSelector: 'abbr[data-date]',
        dateAttr: 'data-date'
    },
    { // Facebook comment
        itemSelector: '.uiUfiComment',
        dateSelector: 'abbr[data-date]',
        dateAttr: 'data-date'
    },
    { // G+ post
        itemSelector: '.ke',
        dateSelector: '.Fl',
        dateAttr: 'title'
    },
    { // G+ comment
        itemSelector: '.zw',
        dateSelector: '.Fl',
        dateAttr: 'title'
    },
    { // MDC wiki
        itemSelector: '#content',
        dateSelector: '.last-mod a',
        dateAttr: 'title'
    },
    { // CNN blog article
        itemSelector: '.cnnPostWrap',
        dateSelector: '.cnnBlogContentDateHead',
        dateAttr: 'text()'
    },
    { // CNN blog comment
        itemSelector: '.cnn_special_comment',
        dateSelector: '.commentFooter',
        dateAttr: 'text()'
    },
    { // Yahoo News article
        itemSelector: '.yom-primary',
        dateSelector: '.byline abbr',
        dateAttr: 'title'
    },
    { // Yahoo News comment
        itemSelector: '.ugccmt-comment',
        dateSelector: '.ugccmt-timestamp abbr',
        dateAttr: 'title'
    },
    { // StackOverflow question
        itemSelector: '#question',
        dateSelector: '.user-action-time .relativetime', // modification date, creation date also available
        dateAttr: 'title'
    },
    { // StackOverflow answer
        itemSelector: '.answer',
        dateSelector: '.user-action-time .relativetime', // modification date, creation date also available
        dateAttr: 'title'
    },
    { // StackOverflow comment
        itemSelector: '.comment',
        dateSelector: '.comment-date',
        dateAttr: 'title'
    },
    { // Amazon helpful review
        itemSelector: '#customerReviews td > div',
        dateSelector: 'nobr',
        dateAttr: 'text()'
    },
    { // Amazon recent review
    // TODO: doesn't work
        itemSelector: '#customerReviews td > div',
        dateSelector: '.tiny',
        dateAttr: 'text()' // TODO: relative date
    },
    { // Twitter
        itemSelector: '.tweet',
        dateSelector: '._timestamp',
        dateAttr: 'data-time' // TODO: POSIX timestamp?
    },
    { // YouTube search results
        itemSelector: '.result-item',
        dateSelector: '.date-added',
        dateAttr: 'text()' // TODO: relative date
    },
    { // YouTube video
        itemSelector: '#watch-container',
        dateSelector: '#eow-date',
        dateAttr: 'text()'
    },
    { // YouTube comment
        itemSelector: '.comment-container',
        dateSelector: '.time',
        dateAttr: 'text()' // TODO: relative date
    },
    { // MediaWiki
        itemSelector: 'body',
        dateSelector: '#footer-info-lastmod, #lastmod',
        dateAttr: 'text()',
        hiliteSelector: '#content'
    },
    { // MSDN blog post, comment
        itemSelector: '.full-post',
        dateSelector: '.post-date .value',
        dateAttr: 'text()'
    },
    { // MSDN documentation comment
        itemSelector: '.Annotation',
        dateSelector: '.AnnotationAddedContainer .AddedUserData', // modified date in AnnotationEditedContainer
        dateAttr: 'text()'
    },
    { // SomethingAwful Forums thread
        itemSelector: '.thread',
        dateSelector: '.lastpost .date',
        dateAttr: 'text()'
    },
    { // SomethingAwful Forums post
        itemSelector: '.post',
        dateSelector: '.postdate',
        dateAttr: 'text()'
    },
    { // SomethingAwful article
        // TODO: doesn't work
        itemSelector: '#content',
        dateSelector: '.byline',
        dateAttr: 'text()'
    },
    { // Google result
        itemSelector: '.vsc',
        dateSelector: '.f',
        dateAttr: 'text()'
    },
    { // Blogger post
        itemSelector: '.date-outer',
        dateSelector: '.date-header span',
        dateAttr: 'text()',
        hiliteSelector: '.post-body'
    },
];

function markDatedItems()
{
    $(document).unbind('DOMNodeInserted', markDatedItems);
    for (var i = 0; i < datedItemTypes.length; i++)
    {
        var datedItemType = datedItemTypes[i];
        $(datedItemType.itemSelector).each(function (index, item)
        {
            var dateSource = $(item).find(datedItemType.dateSelector).first();
            if (dateSource.length === 0) return;
            var dateStr;
            if (datedItemType.dateAttr === 'text()')
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
            var date = parseDate(dateStr);
            $(item).data('freshboxDate', date);
            var hilite;
            if (datedItemType.hiliteSelector)
            {
                hilite = $(datedItemType.hiliteSelector);
            }
            else
            {
                hilite = $(item);
            }
            hilite.css('box-shadow', 'inset 3px 3px 3px ' + colorForDate(date));
        });
    }
    window.setTimeout(function() { $(document).bind('DOMNodeInserted', markDatedItems); }, 100);
}

if (window.top == window.self)
{
    GM_addStyle(GM_getResourceText('commonStyles'));
    $(document)
        .ready(markDatedItems);
}