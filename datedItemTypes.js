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
];
