var browser = browser || chrome;
var hostname = typeof (location) != 'undefined' ? location.hostname : '';
if (hostname.startsWith('www.')) {
    hostname = hostname.substring(4);
}
if (hostname == 'mobile.twitter.com' || hostname == 'mobile.x.com' || hostname == 'x.com')
    hostname = 'twitter.com';
if (hostname.endsWith('.reddit.com'))
    hostname = 'reddit.com';
if (hostname.endsWith('.facebook.com'))
    hostname = 'facebook.com';
if (hostname.endsWith('.youtube.com'))
    hostname = 'youtube.com';
var myself = null;
var isMastodon = null;
const colorLinks = !!window.shinigamiEyesColorLinks;
function fixupSiteStyles() {
    if (hostname == 'facebook.com') {
        const s = [...document.querySelectorAll('script')].map(x => x.innerText.match(/profileSwitcherEligibleProfiles.*username":"(.*?)"/)).map(x => x ? x[1] : null).filter(x => x)[0];
        if (s)
            myself = 'facebook.com/' + s;
    }
    else if (hostname == 'medium.com') {
        addStyleSheet(`
            a.show-thread-link, a.ThreadedConversation-moreRepliesLink {
                color: inherit !important;
            }
            .fullname,
            .stream-item a:hover .fullname,
            .stream-item a:active .fullname
            {color:inherit;}
        `);
    }
    else if (domainIs(hostname, 'tumblr.com')) {
        addStyleSheet(`
            .assigned-label-transphobic { outline: 2px solid var(--ShinigamiEyesTransphobic) !important; }
            .assigned-label-t-friendly { outline: 1px solid var(--ShinigamiEyesTFriendly) !important; }
        `);
    }
    else if (hostname == 'rationalwiki.org' || domainIs(hostname, 'wikipedia.org')) {
        addStyleSheet(`
            .assigned-label-transphobic { outline: 1px solid var(--ShinigamiEyesTransphobic) !important; }
            .assigned-label-t-friendly { outline: 1px solid var(--ShinigamiEyesTFriendly) !important; }
        `);
    }
    else if (hostname == 'twitter.com') {
        const s = [...document.querySelectorAll('script')].map(x => x.innerText.match(/screen_name":"(.*?)"/)).map(x => x ? x[1] : null).filter(x => x)[0];
        myself = s ? 'twitter.com/' + s.toLowerCase() : null;
        addStyleSheet(`
            .pretty-link b, .pretty-link s {
                color: inherit !important;
            }
            
            a.show-thread-link, a.ThreadedConversation-moreRepliesLink {
                color: inherit !important;
            }
            .fullname,
            .stream-item a:hover .fullname,
            .stream-item a:active .fullname
            {color:inherit;}
        `);
    }
    else if (hostname == 'reddit.com') {
        myself = getIdentifier(document.querySelector('#header-bottom-right .user a'));
        if (!myself) {
            let m = document.querySelector('#USER_DROPDOWN_ID');
            if (m) {
                let username = [...m.querySelectorAll('*')].filter(x => x.childNodes.length == 1 && x.firstChild.nodeType == 3).map(x => x.textContent)[0];
                if (username)
                    myself = 'reddit.com/user/' + username;
            }
        }
        addStyleSheet(`
            .author { color: #369 !important;}
        `);
    }
}
function addStyleSheet(css) {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
}
function maybeDisableCustomCss() {
    var shouldDisable = null;
    if (hostname == 'twitter.com')
        shouldDisable = x => x.ownerNode && x.ownerNode.id && x.ownerNode.id.startsWith('user-style');
    else if (hostname == 'medium.com')
        shouldDisable = x => x.ownerNode && x.ownerNode.className && x.ownerNode.className == 'js-collectionStyle';
    else if (hostname == 'disqus.com')
        shouldDisable = x => x.ownerNode && x.ownerNode.id && x.ownerNode.id.startsWith('css_');
    if (shouldDisable)
        [...document.styleSheets].filter(shouldDisable).forEach(x => x.disabled = true);
}
function isElementVisible(x) {
    return !!x.getBoundingClientRect().width;
}
function linkify(oldNode, href) {
    const newLink = document.createElement('a');
    newLink.textContent = oldNode.textContent;
    if (oldNode instanceof HTMLElement) {
        newLink.setAttribute('style', oldNode.getAttribute('style'));
        newLink.className = oldNode.className;
    }
    newLink.href = href;
    oldNode.parentElement.replaceChild(newLink, oldNode);
    return newLink;
}
function linkifyBlueskyLinks() {
    var _a;
    const toLinkify = [...document.querySelectorAll('div[aria-label][role=link][tabindex="0"] > div')].filter(x => x.childNodes.length == 1 && x.firstChild.nodeType == Node.TEXT_NODE && isElementVisible(x));
    for (const oldLink of toLinkify) {
        const identifier = (_a = oldLink.parentElement.getAttribute('aria-label')) !== null && _a !== void 0 ? _a : '';
        if (!/^[\w\-]+\.[\w\.]+$/.test(identifier))
            continue;
        linkify(oldLink, 'https://bsky.app/profile/' + identifier);
    }
    const mobileUiToLinkify = [...document.querySelectorAll('div[dir=auto][style]')].filter(x => x.firstChild == x.lastChild && x.firstChild.nodeType == Node.TEXT_NODE && x.firstChild.textContent == '·').map(x => x.previousSibling).filter(x => { var _a; return ((_a = x.firstChild) === null || _a === void 0 ? void 0 : _a.tagName) == 'DIV' && isElementVisible(x); });
    for (const oldLink of mobileUiToLinkify) {
        const span = oldLink.querySelector('span');
        if (span && span.textContent.startsWith('@')) {
            const identifier = span.textContent.substring(1).trim();
            const href = 'https://bsky.app/profile/' + identifier;
            const displayName = span.parentElement.firstChild;
            linkify(span, href);
            if ((displayName === null || displayName === void 0 ? void 0 : displayName.nodeType) == Node.TEXT_NODE)
                linkify(displayName, href);
        }
    }
    const profileLinks = [...document.querySelectorAll('[data-testid=profileHeaderDisplayName]')].filter(x => isElementVisible(x));
    if (profileLinks.length == 1) {
        const profileLink = profileLinks[0];
        const parts = new URL(location.href).pathname.split('/');
        if (parts[1] == 'profile') {
            const a = linkify(profileLink.firstChild, 'https://bsky.app/profile/' + parts[2]);
            a.style.textDecoration = 'none';
            a.style.pointerEvents = 'auto';
        }
    }
}
function init() {
    isMastodon = !!(document.getElementById('mastodon') || document.querySelector("a[href*='joinmastodon.org/apps']")) || hostname == 'threads.net';
    fixupSiteStyles();
    if (domainIs(hostname, 'youtube.com')) {
        setInterval(updateYouTubeChannelHeader, 300);
        setInterval(updateAllLabels, 6000);
    }
    if (domainIs(hostname, 'bsky.app')) {
        setInterval(linkifyBlueskyLinks, 500);
    }
    if (hostname == 'twitter.com') {
        setInterval(updateTwitterClasses, 800);
    }
    document.addEventListener('contextmenu', evt => {
        lastRightClickedElement = evt.target;
    }, true);
    maybeDisableCustomCss();
    updateAllLabels();
    if (colorLinks) {
        var observer = new MutationObserver(mutationsList => {
            maybeDisableCustomCss();
            for (const mutation of mutationsList) {
                if (mutation.type == 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node instanceof HTMLAnchorElement) {
                            initLink(node);
                        }
                        if (node instanceof HTMLElement) {
                            for (const subnode of node.querySelectorAll('a')) {
                                initLink(subnode);
                            }
                        }
                    }
                }
            }
            solvePendingLabels();
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}
var lastRightClickedElement = null;
var lastAppliedYouTubeUrl = null;
var lastAppliedYouTubeTitle = null;
var lastAppliedTwitterUrl = null;
function updateTwitterClasses() {
    if (location.href != lastAppliedTwitterUrl) {
        setTimeout(updateAllLabels, 200);
        lastAppliedTwitterUrl = location.href;
    }
    for (const a of document.querySelectorAll('a')) {
        if (a.assignedCssLabel && !a.classList.contains('has-assigned-label')) {
            a.classList.add('assigned-label-' + a.assignedCssLabel);
            a.classList.add('has-assigned-label');
        }
    }
}
function updateYouTubeChannelHeader() {
    var url = window.location.href;
    var title = document.querySelector('#channel-header ytd-channel-name yt-formatted-string');
    if (title && !title.parentElement.offsetParent)
        title = null;
    var currentTitle = title ? title.textContent : null;
    if (url == lastAppliedYouTubeUrl && currentTitle == lastAppliedYouTubeTitle)
        return;
    lastAppliedYouTubeUrl = url;
    lastAppliedYouTubeTitle = currentTitle;
    if (currentTitle) {
        var replacement = document.getElementById('channel-title-replacement');
        if (!replacement) {
            replacement = document.createElement('A');
            replacement.id = 'channel-title-replacement';
            replacement.className = title.className;
            title.parentNode.insertBefore(replacement, title.nextSibling);
            title.style.display = 'none';
            replacement.style.fontSize = '2.4rem';
            replacement.style.fontWeight = '400';
            replacement.style.lineHeight = '3rem';
            replacement.style.textDecoration = 'none';
            replacement.style.color = 'var(--yt-spec-text-primary)';
        }
        replacement.textContent = lastAppliedYouTubeTitle;
        replacement.href = lastAppliedYouTubeUrl;
    }
    updateAllLabels();
    setTimeout(updateAllLabels, 2000);
    setTimeout(updateAllLabels, 4000);
}
function updateAllLabels(refresh) {
    if (!colorLinks)
        return;
    if (refresh)
        knownLabels = {};
    for (const a of document.getElementsByTagName('a')) {
        initLink(a);
    }
    solvePendingLabels();
}
var knownLabels = {};
var currentlyAppliedTheme = '_none_';
var labelsToSolve = [];
function solvePendingLabels() {
    if (!labelsToSolve.length)
        return;
    var uniqueIdentifiers = Array.from(new Set(labelsToSolve.map(x => x.identifier)));
    var tosolve = labelsToSolve;
    labelsToSolve = [];
    browser.runtime.sendMessage({ ids: uniqueIdentifiers, myself: myself }, (response) => {
        const theme = response[':theme'];
        if (theme != currentlyAppliedTheme) {
            if (currentlyAppliedTheme)
                document.body.classList.remove('shinigami-eyes-theme-' + currentlyAppliedTheme);
            if (theme)
                document.body.classList.add('shinigami-eyes-theme-' + theme);
            currentlyAppliedTheme = theme;
        }
        for (const item of tosolve) {
            const label = response[item.identifier];
            knownLabels[item.identifier] = label || '';
            applyLabel(item.element, item.identifier);
        }
    });
}
function applyLabel(a, identifier) {
    if (a.assignedCssLabel) {
        a.classList.remove('assigned-label-' + a.assignedCssLabel);
        a.classList.remove('has-assigned-label');
    }
    a.assignedCssLabel = knownLabels[identifier] || '';
    if (a.assignedCssLabel) {
        a.classList.add('assigned-label-' + a.assignedCssLabel);
        a.classList.add('has-assigned-label');
        if (hostname == 'twitter.com')
            a.classList.remove('u-textInheritColor');
    }
}
function initLink(a) {
    var identifier = getIdentifier(a);
    if (!identifier) {
        if (hostname == 'youtube.com' || hostname == 'twitter.com')
            applyLabel(a, '');
        return;
    }
    var label = knownLabels[identifier];
    if (label === undefined) {
        labelsToSolve.push({ element: a, identifier: identifier });
        return;
    }
    applyLabel(a, identifier);
}
function domainIs(host, baseDomain) {
    if (baseDomain.length > host.length)
        return false;
    if (baseDomain.length == host.length)
        return baseDomain == host;
    var k = host.charCodeAt(host.length - baseDomain.length - 1);
    if (k == 0x2E /* . */)
        return host.endsWith(baseDomain);
    else
        return false;
}
function getPartialPath(path, num) {
    var m = path.split('/');
    m = m.slice(1, 1 + num);
    if (m.length && !m[m.length - 1])
        m.length--;
    if (m.length != num)
        return '!!';
    return '/' + m.join('/');
}
function getPathPart(path, index) {
    return path.split('/')[index + 1] || null;
}
function captureRegex(str, regex) {
    if (!str)
        return null;
    var match = str.match(regex);
    if (match && match[1])
        return match[1];
    return null;
}
function getCurrentFacebookPageId() {
    // page
    var elem = document.querySelector("a[rel=theater][aria-label='Profile picture']");
    if (elem) {
        var p = captureRegex(elem.href, /facebook\.com\/(\d+)/);
        if (p)
            return p;
    }
    // page (does not work if page is loaded directly)
    elem = document.querySelector("[ajaxify^='/page_likers_and_visitors_dialog']");
    if (elem)
        return captureRegex(elem.getAttribute('ajaxify'), /\/(\d+)\//);
    // group
    elem = document.querySelector("[id^='headerAction_']");
    if (elem)
        return captureRegex(elem.id, /_(\d+)/);
    // profile
    elem = document.querySelector('#pagelet_timeline_main_column');
    if (elem && elem.dataset.gt)
        return JSON.parse(elem.dataset.gt).profile_owner;
    return null;
}
function getIdentifier(link, originalTarget) {
    try {
        var k = link instanceof Node ? getIdentifierFromElementImpl(link, originalTarget) : getIdentifierFromURLImpl(tryParseURL(link));
        if (!k || k.indexOf('!') != -1)
            return null;
        if (isMastodon && k == location.host)
            return null;
        return k.toLowerCase();
    }
    catch (e) {
        console.warn("Unable to get identifier for " + link);
        return null;
    }
}
function isFacebookPictureLink(element) {
    var href = element.href;
    return href && (href.includes('/photo/') || href.includes('/photo.php'));
}
function getIdentifierFromElementImpl(element, originalTarget) {
    if (!element)
        return null;
    const dataset = element.dataset;
    if (hostname == 'bsky.app') {
        if (element.href.includes('/profile/did:')) {
            const identifier = element.textContent.trim();
            if (identifier.startsWith('@')) {
                return identifier.substring(1);
            }
            return null;
        }
    }
    if (hostname == 'reddit.com') {
        const parent = element.parentElement;
        if (parent && parent.classList.contains('domain') && element.textContent.startsWith('self.'))
            return null;
    }
    else if (hostname == 'disqus.com') {
        if (element.classList && element.classList.contains('time-ago'))
            return null;
    }
    else if (hostname == 'facebook.com') {
        const parent = element.parentElement;
        const firstChild = element.firstChild;
        if (parent && (parent.tagName == 'H1' || parent.id == 'fb-timeline-cover-name')) {
            const id = getCurrentFacebookPageId();
            //console.log('Current fb page: ' + id)
            if (id)
                return 'facebook.com/' + id;
        }
        // comment timestamp
        if (firstChild && firstChild.tagName == 'ABBR' && element.lastChild == firstChild)
            return null;
        // post 'see more'
        if (element.classList.contains('see_more_link'))
            return null;
        // post 'continue reading'
        if (parent && parent.classList.contains('text_exposed_link'))
            return null;
        // React comment timestamp
        if (parent && parent.tagName == 'LI')
            return null;
        // React post timestamp
        if (element.getAttribute('role') == 'link' && parent && parent.tagName == 'SPAN' && firstChild && firstChild.tagName == 'SPAN' && firstChild.tabIndex == 0)
            return null;
        // React big profile picture (user or page)
        if (originalTarget instanceof SVGImageElement && isFacebookPictureLink(element) && !getMatchingAncestorByCss(element, '[role=article]')) {
            return getIdentifier(window.location.href);
        }
        // React cover picture
        if (originalTarget instanceof HTMLImageElement && isFacebookPictureLink(element) && element.getAttribute('aria-label') && !getMatchingAncestorByCss(element, '[role=article]')) {
            return getIdentifier(window.location.href);
        }
        if (dataset) {
            const hovercard = dataset.hovercard;
            if (hovercard) {
                const id = captureRegex(hovercard, /id=(\d+)/);
                if (id)
                    return 'facebook.com/' + id;
            }
            // post Comments link
            if (dataset.testid == 'UFI2CommentsCount/root')
                return null;
            // notification
            if (dataset.testid == 'notif_list_item_link')
                return null;
            // post Comments link
            if (dataset.commentPreludeRef)
                return null;
            // page left sidebar
            if (dataset.endpoint)
                return null;
            // profile tabs
            if (dataset.tabKey)
                return null;
            const gt = dataset.gt;
            if (gt) {
                const gtParsed = JSON.parse(gt);
                if (gtParsed.engagement && gtParsed.engagement.eng_tid) {
                    return 'facebook.com/' + gtParsed.engagement.eng_tid;
                }
            }
            // comment interaction buttons
            if (dataset.sigil)
                return null;
            let p = element;
            while (p) {
                const bt = p.dataset.bt;
                if (bt) {
                    const btParsed = JSON.parse(bt);
                    if (btParsed.id)
                        return 'facebook.com/' + btParsed.id;
                }
                p = p.parentElement;
            }
        }
    }
    else if (hostname == 'twitter.com') {
        if (dataset && dataset.expandedUrl)
            return getIdentifier(dataset.expandedUrl);
        if (element.href.startsWith('https://t.co/')) {
            const title = element.title;
            if (title && (title.startsWith('http://') || title.startsWith('https://')))
                return getIdentifier(title);
            const content = element.textContent;
            if (!content.includes(' ') && content.includes('.') && !content.includes('…')) {
                const url = content.startsWith('http://') || content.startsWith('https://') ? content : 'http://' + content;
                return getIdentifier(url);
            }
        }
    }
    else if (domainIs(hostname, 'wikipedia.org')) {
        if (element.classList.contains('interlanguage-link-target'))
            return null;
    }
    if (element.classList.contains('tumblelog'))
        return element.textContent.replace('@', '') + '.tumblr.com';
    const href = element.href;
    if (href && (!href.endsWith('#') || href.includes('&stick=')))
        return getIdentifierFromURLImpl(tryParseURL(href));
    return null;
}
function tryParseURL(urlstr) {
    if (!urlstr)
        return null;
    try {
        const url = new URL(urlstr);
        if (url.protocol != 'http:' && url.protocol != 'https:')
            return null;
        return url;
    }
    catch (e) {
        return null;
    }
}
function tryUnwrapNestedURL(url) {
    if (!url)
        return null;
    if (domainIs(url.host, 'youtube.com') && url.pathname == '/redirect') {
        const q = url.searchParams.get('q');
        if (q && !q.startsWith('http:') && !q.startsWith('https:') && q.includes('.'))
            return tryParseURL('http://' + q);
    }
    if (url.href.indexOf('http', 1) != -1) {
        if (url.pathname.startsWith('/intl/'))
            return null; // facebook language switch links
        // const values = url.searchParams.values()
        // HACK: values(...) is not iterable on facebook (babel polyfill?)
        const values = url.search.split('&').map(x => {
            if (x.startsWith('ref_url='))
                return '';
            const eq = x.indexOf('=');
            return eq == -1 ? '' : decodeURIComponent(x.substr(eq + 1));
        });
        for (const value of values) {
            if (value.startsWith('http:') || value.startsWith('https:')) {
                return tryParseURL(value);
            }
        }
        const newurl = tryParseURL(url.href.substring(url.href.indexOf('http', 1)));
        if (newurl)
            return newurl;
    }
    return null;
}
const MASTODON_FALSE_POSITIVES = ['tiktok.com', 'youtube.com', 'medium.com', 'foundation.app', 'pronouns.page'];
function getIdentifierFromURLImpl(url) {
    if (!url)
        return null;
    // nested urls
    const nested = tryUnwrapNestedURL(url);
    if (nested) {
        return getIdentifierFromURLImpl(nested);
    }
    // fb group member badge
    if (url.pathname.includes('/badge_member_list/'))
        return null;
    let host = url.hostname;
    const searchParams = url.searchParams;
    if (domainIs(host, 'web.archive.org')) {
        const match = captureRegex(url.href, /\/web\/\w+\/(.*)/);
        if (!match)
            return null;
        return getIdentifierFromURLImpl(tryParseURL('http://' + match));
    }
    if (host.startsWith('www.'))
        host = host.substring(4);
    const pathArray = url.pathname.split('/');
    if (domainIs(host, 'bsky.social') || domainIs(host, 'bsky.app')) {
        let username = null;
        if (pathArray[3] == 'lists')
            return null;
        if (pathArray[3] == 'feed')
            return null;
        if (pathArray[1] == 'profile') {
            username = pathArray[2];
            if (username.startsWith('@'))
                username = username.substring(1);
        }
        else if (url.pathname.startsWith('/@')) {
            username = pathArray[1].substring(1);
        }
        else if (host.includes('.bsky.')) {
            username = captureRegex(host, /^(.+)\.bsky/);
        }
        return username ? (username.includes('.') ? username : username + '.bsky.social') : null;
    }
    if (domainIs(host, 'facebook.com')) {
        if (searchParams.get('story_fbid'))
            return null;
        const fbId = searchParams.get('id');
        const p = url.pathname.replace('/pg/', '/');
        const isGroup = p.startsWith('/groups/');
        if (isGroup && p.includes('/user/'))
            return 'facebook.com/' + pathArray[4]; // fb.com/groups/.../user/...
        return 'facebook.com/' + (fbId || getPartialPath(p, isGroup ? 2 : 1).substring(1));
    }
    else if (domainIs(host, 'reddit.com')) {
        const pathname = url.pathname.replace('/u/', '/user/');
        if (!pathname.startsWith('/user/') && !pathname.startsWith('/r/'))
            return null;
        if (pathname.includes('/comments/') && hostname == 'reddit.com')
            return null;
        return 'reddit.com' + getPartialPath(pathname, 2);
    }
    else if (domainIs(host, 'twitter.com') || domainIs(host, 'x.com')) {
        return 'twitter.com' + getPartialPath(url.pathname, 1);
    }
    else if (domainIs(host, 'youtube.com')) {
        const pathname = url.pathname;
        if (pathname.startsWith('/user/') || pathname.startsWith('/c/') || pathname.startsWith('/channel/'))
            return 'youtube.com' + getPartialPath(pathname, 2);
        return 'youtube.com' + getPartialPath(pathname, 1);
    }
    else if (domainIs(host, 'disqus.com') && url.pathname.startsWith('/by/')) {
        return 'disqus.com' + getPartialPath(url.pathname, 2);
    }
    else if (domainIs(host, 'medium.com')) {
        const hostParts = host.split('.');
        if (hostParts.length == 3 && hostParts[0] != 'www') {
            return host;
        }
        return 'medium.com' + getPartialPath(url.pathname.replace('/t/', '/'), 1);
    }
    else if (domainIs(host, 'tumblr.com')) {
        if (url.pathname.startsWith('/register/follow/')) {
            const name = getPathPart(url.pathname, 2);
            return name ? name + '.tumblr.com' : null;
        }
        if (host == 'tumblr.com' || host == 'at.tumblr.com') {
            let name = getPathPart(url.pathname, 0);
            if (!name)
                return null;
            if (name == 'blog')
                name = getPathPart(url.pathname, 1);
            if (['new', 'dashboard', 'explore', 'inbox', 'likes', 'following', 'settings', 'changes', 'help', 'about', 'apps', 'policy', 'post', 'search', 'tagged'].includes(name))
                return null;
            if (name.startsWith('@'))
                name = name.substring(1);
            return name + '.tumblr.com';
        }
        if (host != 'tumblr.com' && host != 'assets.tumblr.com' && host.indexOf('.media.') == -1) {
            if (!url.pathname.includes('/tagged/'))
                return url.host;
        }
        return null;
    }
    else if (domainIs(host, 'wikipedia.org') || domainIs(host, 'rationalwiki.org')) {
        const pathname = url.pathname;
        if (url.hash)
            return null;
        if (pathname == '/w/index.php' && searchParams.get('action') == 'edit') {
            const title = searchParams.get('title');
            if (title && title.startsWith('User:')) {
                return 'wikipedia.org/wiki/' + title;
            }
        }
        if (pathname.startsWith('/wiki/Special:Contributions/') && url.href == window.location.href)
            return 'wikipedia.org/wiki/User:' + pathArray[3];
        if (pathname.startsWith('/wiki/User:'))
            return 'wikipedia.org/wiki/User:' + pathArray[2].split(':')[1];
        if (pathname.includes(':'))
            return null;
        if (pathname.startsWith('/wiki/'))
            return 'wikipedia.org' + decodeURIComponent(getPartialPath(pathname, 2));
        else
            return null;
    }
    else if (host.indexOf('.blogspot.') != -1) {
        const m = captureRegex(host, /([a-zA-Z0-9\-]*)\.blogspot/);
        if (m)
            return m + '.blogspot.com';
        else
            return null;
    }
    else if (host.includes('google.')) {
        if (url.pathname == '/search' && searchParams.get('stick') && !searchParams.get('tbm') && !searchParams.get('start')) {
            const q = searchParams.get('q');
            if (q)
                return 'wikipedia.org/wiki/' + q.replace(/\s/g, '_');
        }
        return null;
    }
    else if (domainIs(host, 'cohost.org')) {
        return 'cohost.org' + getPartialPath(url.pathname, 1);
    }
    else {
        if (host.startsWith('m.'))
            host = host.substr(2);
        if (url.pathname.startsWith('/@') || url.pathname.startsWith('/web/@')) {
            let username = getPathPart(url.pathname, 0);
            if (username == 'web') {
                username = getPathPart(url.pathname, 1);
            }
            username = username.substring(1);
            var parts = username.split('@');
            if (parts.length == 2)
                return parts[1] + '/@' + parts[0];
            if (parts.length == 1 && username && !MASTODON_FALSE_POSITIVES.includes(host))
                return host + '/@' + username;
        }
        if (url.pathname.startsWith('/users/')) {
            let username = getPathPart(url.pathname, 1);
            if (username && !MASTODON_FALSE_POSITIVES.includes(host))
                return host + '/@' + username;
        }
        return host;
    }
}
init();
var lastGeneratedLinkId = 0;
function getMatchingAncestor(node, match) {
    while (node) {
        if (match(node))
            return node;
        node = node.parentElement;
    }
    return node;
}
function getOutermostMatchingAncestor(node, match) {
    let result = null;
    while (node) {
        if (match(node))
            result = node;
        node = node.parentElement;
    }
    return result;
}
function getAbsoluteOffsetTop(node) {
    let top = 0;
    while (node) {
        top += node.offsetTop;
        node = node.offsetParent instanceof HTMLElement ? node.offsetParent : null;
    }
    return top;
}
function getMatchingAncestorByCss(node, cssMatch) {
    return getMatchingAncestor(node, x => x.matches(cssMatch));
}
function getSnippet(node) {
    try {
        return getSnippetImpl(node);
    }
    catch (e) {
        console.warn("Could not obtain snippet: " + e);
        return null;
    }
}
function getSnippetImpl(node) {
    var _a, _b, _c;
    if (hostname == 'facebook.com') {
        const pathname = window.location.pathname;
        const isPhotoPage = pathname.startsWith('/photo') || pathname.includes('/photos/') || pathname.startsWith('/video') || pathname.includes('/videos/');
        if (isPhotoPage) {
            const sidebar = document.querySelector('[role=complementary]');
            if (sidebar)
                return sidebar.parentElement;
        }
        const isSearchPage = pathname.startsWith('/search/');
        return getMatchingAncestor(node, x => {
            if (x.getAttribute('role') == 'article' && (isSearchPage || x.getAttribute('aria-labelledby')))
                return true;
            var dataset = x.dataset;
            if (!dataset)
                return false;
            if (dataset.ftr)
                return true;
            if (dataset.highlightTokens)
                return true;
            if (dataset.gt && dataset.vistracking)
                return true;
            return false;
        });
    }
    if (hostname == 'reddit.com')
        return getMatchingAncestorByCss(node, '.scrollerItem, .thing, .Comment');
    if (hostname == 'twitter.com')
        return getMatchingAncestorByCss(node, '.stream-item, .permalink-tweet-container, article');
    if (hostname == 'disqus.com')
        return getMatchingAncestorByCss(node, '.post-content');
    if (hostname == 'medium.com')
        return getMatchingAncestorByCss(node, '.streamItem, .streamItemConversationItem');
    if (hostname == 'youtube.com')
        return getMatchingAncestorByCss(node, 'ytd-comment-renderer, ytd-video-secondary-info-renderer');
    if (hostname == 'tumblr.com')
        return getMatchingAncestor(node, x => (x.dataset && !!(x.dataset.postId || x.dataset.id)) || x.classList.contains('post'));
    if (hostname == 'threads.net') {
        if (location.pathname.includes('/post/')) {
            return getOutermostMatchingAncestor(node, x => getAbsoluteOffsetTop(x) > 30);
        }
        else {
            return getOutermostMatchingAncestor(node, x => x.dataset.pressableContainer == 'true');
        }
    }
    if (hostname == 'bsky.app') {
        if (location.pathname.includes('/post/')) {
            return (_b = (_a = getOutermostMatchingAncestor(node, x => { var _a; return (_a = x.dataset.testid) === null || _a === void 0 ? void 0 : _a.startsWith('postThreadItem-by-'); })) === null || _a === void 0 ? void 0 : _a.parentElement) === null || _b === void 0 ? void 0 : _b.parentElement;
        }
        else {
            return getOutermostMatchingAncestor(node, x => { var _a; return (_a = x.dataset.testid) === null || _a === void 0 ? void 0 : _a.startsWith('feedItem-by-'); });
        }
    }
    if (isMastodon)
        return (_c = (/\/\d+$/.test(location.pathname) ? getMatchingAncestorByCss(node, '.scrollable') : null)) !== null && _c !== void 0 ? _c : getMatchingAncestorByCss(node, '.status, article, .detailed-status__wrapper, .status__wrapper-reply');
    return null;
}
function getBadIdentifierReason(identifier, url, target) {
    identifier = identifier || '';
    url = url || '';
    if (url) {
        const nested = tryUnwrapNestedURL(tryParseURL(url));
        if (nested)
            url = nested.href;
    }
    if (identifier == 't.co')
        return 'Shortened link. Please follow the link and then mark the resulting page.';
    if (identifier.startsWith('reddit.com/user/') ||
        identifier == 'twitter.com/threadreaderapp' ||
        identifier == 'twitter.com/threader_app')
        return 'This is user is a bot.';
    if (identifier == 'twitter.com/hashtag')
        return 'Hashtags cannot be labeled, only users.';
    if (url.includes('youtube.com/watch'))
        return 'Only channels can be labeled, not specific videos.';
    if (url.includes('reddit.com/') && url.includes('/comments/'))
        return 'Only users and subreddits can be labeled, not specific posts.';
    if (url.includes('facebook.com') && (url.includes('/posts/') ||
        url.includes('/photo/') ||
        url.includes('/photo.php') ||
        url.includes('/permalink.php') ||
        url.includes('/permalink/') ||
        url.includes('/photos/')))
        return 'Only pages, users and groups can be labeled, not specific posts or photos.';
    if (url.includes('wiki') && url.includes('#'))
        return 'Wiki paragraphs cannot be labeled, only whole articles.';
    if (url.includes('tumblr.com/') && (url.includes('/tagged/') || url.includes('/search/')))
        return 'Only blogs can be labeled, not tags.';
    return null;
}
var previousConfirmationMessage = null;
function displayConfirmation(identifier, label, badIdentifierReason, url, target) {
    if (previousConfirmationMessage) {
        previousConfirmationMessage.remove();
        previousConfirmationMessage = null;
    }
    if (!label)
        return;
    if (colorLinks && label != 'bad-identifier')
        return;
    const confirmation = document.createElement('div');
    const background = label == 't-friendly' ? '#eaffcf' :
        label == 'transphobic' ? '#f5d7d7' :
            '#eeeeee';
    confirmation.style.cssText = `transition: opacity 7s ease-in-out !important; opacity: 1; position: fixed; padding: 30px 15px; z-index: 99999999; white-space: pre-wrap; top: 200px; left: 30%; right: 30%; background: ${background}; color: black; font-weight: bold; font-family: Arial; box-shadow: 0px 5px 10px #ddd; border: 1px solid #ccc; font-size: 11pt;`;
    let text;
    if (label == 'bad-identifier') {
        const displayReason = getBadIdentifierReason(identifier, url, target);
        if (displayReason)
            text = displayReason;
        else if (badIdentifierReason == 'SN')
            text = 'This social network is not supported: ' + identifier + '.';
        else if (badIdentifierReason == 'AR')
            text = 'This is an archival link, it cannot be labeled: ' + identifier;
        else
            text = `This item could not be labeled. Possible reasons:
 • It doesn't represent a specific user or page
 • It's not a kind of object supported by Shinigami Eyes

 ${identifier || url}
`;
    }
    else {
        const suffix = (isMastodon && !colorLinks) ? 'on supported Mastodon instances.' : 'on search engines and social networks.';
        text = identifier + (label == 't-friendly' ? ' will be displayed as trans-friendly ' + suffix :
            label == 'transphobic' ? ' will be displayed as anti-trans ' + suffix :
                ' has been cleared.');
    }
    confirmation.textContent = text;
    document.body.appendChild(confirmation);
    previousConfirmationMessage = confirmation;
    confirmation.addEventListener('mousedown', () => confirmation.remove());
    setTimeout(() => {
        confirmation.style.opacity = '0';
    }, 2000);
    setTimeout(() => {
        confirmation.remove();
    }, 9000);
}
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.updateAllLabels || message.confirmSetLabel) {
        displayConfirmation(message.confirmSetIdentifier, message.confirmSetLabel, message.badIdentifierReason, message.confirmSetUrl, null);
        updateAllLabels(true);
        return;
    }
    message.contextPage = window.location.href;
    const originalTarget = lastRightClickedElement;
    let target = originalTarget; // message.elementId ? browser.menus.getTargetElement(message.elementId) : null;
    while (target) {
        if (target instanceof HTMLAnchorElement)
            break;
        target = target.parentElement;
    }
    if (target && target.href != message.url)
        target = null;
    var identifier = target ? getIdentifier(target, originalTarget) : getIdentifier(message.url);
    if (!identifier) {
        displayConfirmation(null, 'bad-identifier', null, message.url, target);
        return;
    }
    message.identifier = identifier;
    if (identifier.startsWith('facebook.com/'))
        message.secondaryIdentifier = getIdentifier(message.url);
    var snippet = getSnippet(target);
    message.linkId = ++lastGeneratedLinkId;
    if (target)
        target.setAttribute('shinigami-eyes-link-id', '' + lastGeneratedLinkId);
    message.snippet = snippet ? snippet.outerHTML : null;
    var debugClass = 'shinigami-eyes-debug-snippet-highlight';
    if (snippet && message.debug) {
        snippet.classList.add(debugClass);
        if (message.debug <= 1)
            setTimeout(() => snippet.classList.remove(debugClass), 1500);
    }
    sendResponse(message);
});
