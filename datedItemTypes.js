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
        desc: "G+ post",
        itemSelector: '.gi',
        dateSelector: '.hl',
        dateAttr: 'title',
    },
    {
        desc: "G+ comment",
        itemSelector: '.qx',
        dateSelector: '.hl',
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
    // http://microformats.org/wiki/hatom
    // http://microformats.org/wiki/value-class-pattern#Parsing_machine-data_value-title
    {
        desc: "hAtom microformat",
        itemSelector: '.hentry',
        dateSelector: '.updated',
    },
    {
        desc: "hAtom microformat",
        itemSelector: '.hentry',
        dateSelector: '.updated .value',
    },
    {
        desc: "hAtom microformat",
        itemSelector: '.hentry',
        dateSelector: '.updated .value-title',
        dateAttr: 'title',
    },
    {
        desc: "hAtom microformat",
        itemSelector: '.hentry',
        dateSelector: '.published',
    },
    {
        desc: "hAtom microformat",
        itemSelector: '.hentry',
        dateSelector: '.published .value',
    },
    {
        desc: "hAtom microformat",
        itemSelector: '.hentry',
        dateSelector: '.published .value-title',
        dateAttr: 'title',
    },
    {
        desc: "WordPress post",
        itemSelector: '.post',
        dateSelector: '.post-date',
    },
    {
        desc: "WordPress comment",
        itemSelector: '.comment',
        dateSelector: '.comment-meta',
    },
    {
        desc: "WordPress pingback",
        itemSelector: '.pingback',
        dateSelector: '.comment-meta',
    },
    {
        desc: "The Atlantic",
        itemSelector: '#article',
        dateSelector: '.metadata .date',
    },
    {
        desc: "Yahoo search results",
        itemSelector: '.res',
        dateSelector: '.yschttl',
        dateAttr: 'href',
    },
    {
        desc: "USA Today",
        itemSelector: '#content-post',
        dateSelector: '#post-date-updated',
    },
    {
        desc: "Pluck comments",
        itemSelector: '.pluck-comm-single-comment-main',
        dateSelector: '.pluck-comm-timestamp',
    },
    {
        desc: "ABC News",
        itemSelector: '#story_core',
        dateSelector: '.byline_date .date',
    },
    {
        desc: "Daily Kos",
        itemSelector: '.article',
        dateSelector: '.meta .date',
    },
    {
        desc: "Daily Kos comment",
        itemSelector: '.cx',
        dateSelector: '.cb',
    },
    {
        desc: "Daily Kos comment (folded)",
        itemSelector: '.csx',
        dateSelector: 'h5',
    },
    {
        desc: "NYT article",
        itemSelector: '#article',
        dateSelector: '.dateline',
    },
    {
        desc: "NYT story summary",
        itemSelector: '.story',
        dateSelector: '.timestamp',
        // TODO: sometimes uses time without date instead of relative time
    },
    {
        desc: "NYT comment",
        itemSelector: '.post',
        dateSelector: '.meta .date',
    },
    {
        desc: "The Daily Beast story summary",
        itemSelector: '.media',
        dateSelector: 'time',
        dateAttr: 'datetime',
    },
    {
        desc: "The Daily Beast story summary",
        itemSelector: '.story, .media',
        dateSelector: 'a',
        dateAttr: 'href',
    },
    {
        desc: "The Daily Beast featured content",
        itemSelector: '.featureContent',
        dateSelector: 'a',
        dateAttr: 'href',
    },
    {
        desc: "The Daily Beast story",
        itemSelector: '.blogEntry, .cheat',
        dateSelector: '.timestamp',
    },
    {
        desc: "Echo comment",
        itemSelector: '.echo-item-content',
        dateSelector: '.echo-item-date',
    },
    {
        desc: "HTML5 article",
        itemSelector: 'article',
        dateSelector: 'time[pubdate]',
        dateAttr: 'datetime',
    },
    {
        desc: "LA Times article",
        itemSelector: '.article',
        dateSelector: '.date',
    },
    {
        desc: "LA Times comment",
        itemSelector: '.comment',
        dateSelector: '.comment-info',
    },
    {
        desc: "LA Times story summary",
        itemSelector: '.headlineItem',
        dateSelector: '.headline a',
        dateAttr: 'href',
    },
    {
        desc: "LA Times story summary",
        itemSelector: '.feedMasherList li',
        dateSelector: '.publishDate',
    },
    {
        desc: "Tumbler (Prologue theme)",
        itemSelector: '.post',
        dateSelector: '.posted',
    },
    {
        desc: "Tumbler (Transcender theme)",
        itemSelector: 'article',
        dateSelector: 'footer .time',
    },
    {
        desc: "Tumbler (Effector theme)",
        itemSelector: '.post',
        dateSelector: '.date a, .date-reblogged a',
        dateAttr: 'title',
    },
    {
        desc: "Tumbler (Redux theme)",
        itemSelector: '.post',
        dateSelector: '.date',
    },
    {
        desc: "SoundCloud",
        itemSelector: 'div.player',
        dateSelector: 'abbr.pretty-date',
        dateAttr: 'title',
    },
];

var fallbackDatedItemTypes = [
    {
        desc: "Date in time tag",
        itemSelector: 'body',
        dateSelector: 'time[datetime]',
        dateAttr: 'datetime',
    },
    {
        desc: "Date in title attribute",
        itemSelector: 'body',
        dateSelector: '[title]',
        dateAttr: 'title',
    },
];
