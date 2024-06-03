var { shinigamiEyesFindTwitterNumericIds } = (function () {
    class Queue {
        constructor() {
            this.pending = [];
            this.processed = new Set();
        }
        enqueue(item) {
            if (this.processed.has(item))
                return;
            this.processed.add(item);
            this.pending.push(item);
        }
        dequeue() {
            if (!this.pending.length)
                return null;
            return this.pending.shift();
        }
        has(key) {
            return this.processed.has(key);
        }
    }
    class NodeQueue extends Queue {
    }
    class ReactObjectQueue extends Queue {
    }
    function exploreNodeAndNeighborhood(root, wantIdForScreenName) {
        const nodeQueue = new NodeQueue();
        const reactQueue = new ReactObjectQueue();
        const mappings = [];
        const deadline = Date.now() + 150;
        while (root) {
            if (exploreNodeAndDescendants(root, nodeQueue, reactQueue, wantIdForScreenName, mappings, deadline))
                break;
            root = root.parentNode;
        }
        return { nodeQueue, reactQueue, mappings };
    }
    function exploreNodeAndDescendants(root, nodeQueue, reactQueue, wantIdForScreenName, destination, deadline) {
        nodeQueue.enqueue(root);
        let node;
        while (node = nodeQueue.dequeue()) {
            for (const name of Object.getOwnPropertyNames(node).filter(x => x.startsWith('__reactProps'))) {
                const value = node[name];
                if (exploreReactObjectTree(value, reactQueue, wantIdForScreenName, destination, deadline))
                    return true;
            }
            for (let child = node.firstChild; child; child = child.nextSibling) {
                nodeQueue.enqueue(child);
            }
        }
        return false;
    }
    function exploreReactObjectTree(root, queue, wantIdForScreenName, destination, deadline) {
        queue.enqueue(root);
        let obj;
        while (obj = queue.dequeue()) {
            let userName = null;
            try {
                userName = obj.screen_name;
            }
            catch (e) {
            }
            if (userName) {
                let numericId = null;
                try {
                    numericId = obj.id_str;
                }
                catch (e) {
                }
                if (numericId) {
                    destination.push({ userName: userName, numericId: numericId });
                    if (wantIdForScreenName && userName.toLowerCase() == wantIdForScreenName.toLowerCase())
                        return true;
                    continue;
                }
            }
            let props;
            try {
                props = Object.getOwnPropertyNames(obj);
            }
            catch (e) {
                continue;
            }
            for (const name of props) {
                if (name == '_owner')
                    continue;
                let val = null;
                try {
                    val = obj[name];
                }
                catch (_a) {
                }
                if (!val)
                    continue;
                if (typeof val != 'object') {
                    continue;
                }
                if (val instanceof Node || val instanceof Window)
                    continue;
                queue.enqueue(val);
            }
            if (queue.processed.size >= 1000 || Date.now() > deadline) {
                //console.log('Reached limit.')
                return true;
            }
        }
        return false;
    }
    function shinigamiEyesFindTwitterNumericIds(request, isFirefox) {
        var _a;
        const link = document.querySelector("[shinigami-eyes-link-id='" + request.linkId + "']");
        let article = link ? ((_a = link.closest('article')) !== null && _a !== void 0 ? _a : link) : document.body;
        //console.log('Starting exploration from: ');
        //console.log(article);
        if (isFirefox)
            article = article.wrappedJSObject;
        const result = exploreNodeAndNeighborhood(article, request.wantIdForScreenName);
        //console.log('Explored nodes: ' + result.nodeQueue.processed.size + ', explored objects: ' + result.reactQueue.processed.size);
        return { mappings: result.mappings };
    }
    return { shinigamiEyesFindTwitterNumericIds };
})();
window.addEventListener("message", (event) => {
    var _a;
    if (event.origin !== 'https://x.com' && event.origin !== 'https://twitter.com')
        return;
    const request = (_a = event.data) === null || _a === void 0 ? void 0 : _a.shinigamiEyesFindTwitterNumericIdsRequest;
    if (request) {
        let result = null;
        try {
            result = shinigamiEyesFindTwitterNumericIds(request, false);
        }
        catch (e) {
            console.warn(e);
        }
        result !== null && result !== void 0 ? result : (result = {});
        result.requestId = request.requestId;
        window.postMessage({
            shinigamiEyesFindTwitterNumericIdsResponse: result
        });
    }
}, false);
