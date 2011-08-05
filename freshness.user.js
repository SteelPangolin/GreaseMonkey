// ==UserScript==
// @name           Freshness
// @namespace      http://bat-country.us/
// @include        *
// @require        http://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min.js
// ==/UserScript==

function getLastModifedFromGoogle(url, callback)
{
    GM_xmlhttpRequest({
        method: 'GET',
        url: 'http://www.google.com/search?q=inurl:' + encodeURIComponent(document.URL) + '&as_qdr=y15',
        onload: function(response) {
            var range = document.createRange();
            var frag = range.createContextualFragment(response.responseText);
            var doc = document.implementation.createHTMLDocument(null);
            doc.adoptNode(frag);
            doc.documentElement.appendChild(frag);
            callback($('li.g', doc).first().find('span.f').get(0).textContent);
        }
    });
}

function displayFreshnessText(text)
{
    $('body').append('<div id="freshbox" style="position: absolute; top: 10px; left: 10px; border-radius: 3px; border: 3px #FFBC00 solid; color: #FFDA73; background-color: #A67A00; padding: 3px;">' + text + ' &#x2716;</div>');
    $('#freshbox').click(function() { $(this).fadeOut('fast') });
}

$(document).ready(function() {
    getLastModifedFromGoogle(document.URL, displayFreshnessText);
});