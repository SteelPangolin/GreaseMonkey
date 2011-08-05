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
        onload: function(response) {
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
    font-size: 100%;\
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

$(document).ready(function() {
    //getLastModifedFromGoogle(document.URL, displayFreshnessText);
    displayFreshnessText(document.lastModified, 'document.lastModified', '#');
});