// ==UserScript==
// @name           Freshbox
// @namespace      http://bat-country.us/
// @include        *
// @require        http://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min.js
// @require        http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.1.6/underscore-min.js
// @require        https://raw.github.com/SteelPangolin/jstools/master/string.js
// @require        https://raw.github.com/SteelPangolin/jstools/master/array.js
// @require        https://raw.github.com/SteelPangolin/jstools/master/math.js
// @require        https://raw.github.com/SteelPangolin/jstools/master/xpath.js
// @require        https://raw.github.com/SteelPangolin/jstools/master/greasemonkey.js
// @require        https://raw.github.com/SteelPangolin/GreaseMonkey/master/color.js
// @require        https://raw.github.com/SteelPangolin/GreaseMonkey/master/date.js
// @require        https://raw.github.com/SteelPangolin/GreaseMonkey/master/datedItemTypes.js
// ==/UserScript==

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
        age_ms: 5 * timeUnits.year,
        color: '#88c',
    },
];

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
        return stops.get(-1).color;
    }
    var x = (age_ms - stopA.age_ms) / (stopB.age_ms - stopA.age_ms);
    return rgb2css(hsv2rgb(interpolateHSV(
        x,
        rgb2hsv(css2rgb(stopA.color)),
        rgb2hsv(css2rgb(stopB.color)))));
}

function styleDateSource(dateSource, date)
{
    var color = colorForDate(date);
    dateSource.css('border', '2px dotted {0}'.format(color));
}

function styleContent(hilite, date)
{
    var color = colorForDate(date);
    hilite.css('box-shadow', 'inset 3px 3px 3px {0}'.format(color));
}

function extractDateString(dateSource, dateAttr)
{
    if (!datedItemType.dateAttr)
    {
        return dateSource.text();
    }
    else if (datedItemType.dateAttr.startsWith('data-'))
    {
        return dateSource.data(datedItemType.dateAttr.slice(5));
    }
    else
    {
        return dateSource.attr(datedItemType.dateAttr);
    }
}

function markDatedItemType(datedItemType)
{
    var foundAtLeastOneInstance = false;
    $(datedItemType.itemSelector).each(function (index, item)
    {
        try
        {
            var dateSource = $(item).find(datedItemType.dateSelector).first();
            if (dateSource.length === 0) return;
            var dateStr = extractDateString(dateSource, datedItemType.dateAttr);
            if (!dateStr) return;
            var date = specialDateParsers.hasOwnProperty(datedItemType.dateParser)
                ? specialDateParsers[datedItemType.dateParser](dateStr)
                : parseDate(dateStr);
            if (!date) return;
            foundAtLeastOneInstance = true;
            styleDateSource(dateSource, date);
            var hilite = datedItemType.hiliteSelector
                ? $(item).find(datedItemType.hiliteSelector).first()
                : $(item);
            styleContent(hilite, date);
        }
        catch (exception)
        {
            GM_log(exception);
        }
    });
    return foundAtLeastOneInstance;
}

function markDatedItems()
{
    var foundKnownDateMarkup = false;
    for (var i = 0; i < datedItemTypes.length; i++)
    {
        foundKnownDateMarkup |= markDatedItemType(datedItemTypes[i]);
    }
    if (!foundKnownDateMarkup) // fall back to generic page coloring
    {
        // look for date in document URL
        var date = parseDate(document.URL, urlDateParsers);
        if (date)
        {
            styleContent($(body), date);
            return;
        }
        // look for absolute dates in text
        var textNodes = xpath('//text()');
        for (var i = 0; i < textNodes.length; i++)
        {
            var textNode = textNodes[i];
            if (!(textNode instanceof Text)) continue; // skip comments
            date = parseDate(textNode.data, textDateParsers);
            if (date)
            {
                styleDateSource($(textNode.parentNode), date);
                styleContent($('body'), date);
                return;
            }
        }
    }
}

if (window.top == window.self)
{
    $(document)
        .bind('DOMNodeInserted', _.debounce(markDatedItems, 200))
        .ready(markDatedItems);
}