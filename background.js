/* global browser */

const manifest = browser.runtime.getManifest();
const extname = manifest.name;

const filter = {
    urls: ["<all_urls>"],
    properties: ["url"]
}

const postfix = '#trackmark';
let marks = new Map();

function makeId(length) {
    var result           = '';
    var characters       = '0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

function onTabsRemoved (tabId /*, removeInfo */) {
	if (marks.has(tabId)) {
		//console.debug(`stopped tracking for tabId: ${tabId}`);
		delete marks.delete(tabId);
	}
}

async function onTabsUpdated (tabId, changeInfo, tabInfo) {

	const tabUrl = tabInfo.url;
	const tabTitle = tabInfo.title;

	//if(tabUrl.endsWith(postfix)){
	if( /.*#trackmark[0-9]{8}$/.test(tabUrl) ){
		//console.debug(`started tracking for tabId: ${tabId}`);
		marks.set(tabId,{
                        id: tabUrl.split("#trackmark")[1],
                        url: tabUrl.slice(0, -(postfix.length+8))
        });
		return;
	}

	if( marks.has(tabId) && marks.get(tabId).url !== tabUrl ){

		const n_url = new URL(tabUrl);
		const p_url = new URL(marks.get(tabId).url);

		// check if we are on the same origin
		if( n_url.origin !== p_url.origin ) {
			onTabsRemoved(tabId);
			return;
		}

		//console.debug(`tab: ${tabId} - url changed from ${marks.get(tabId).url} to ${tabUrl}`);
		const bmark = await browser.bookmarks.search({ url: marks.get(tabId).url + "#trackmark" + marks.get(tabId).id });
		if(bmark.length > 0) {
			browser.bookmarks.update(bmark[0].id, { title: "AUB: " + tabTitle, url: tabUrl + "#trackmark" + marks.get(tabId).id });
			marks.set(tabId, {
                            url: tabUrl,
                            id: marks.get(tabId).id
            });
		}
	}
}

async function onBrowserActionClicked (tab) {
    let tmp;
    try {
        tmp = await browser.storage.local.get(extname);
        tmp = tmp[extname];
    }catch(e){
        tmp = undefined;
    }
    const murl = tab.url + "#trackmark" + makeId(8);
    browser.bookmarks.create({ parentId: tmp, title: "AUB:" + tab.title, url: murl });
    browser.tabs.update(tab.id, { url: murl });
}

browser.menus.create({
	id: extname,
	title: 'Check to save Auto Updating Bookmarks here',
	type: "radio",
	contexts: ["bookmark"],
	visible: false,
	checked: false,
	onclick: async function(info/*, tab*/) {
		if(info.bookmarkId ) {
			let tmp = await browser.storage.local.get(extname);
			if (tmp) {
				tmp = tmp[extname];
			}
			let blub = {};
			blub[extname] = (info.bookmarkId === tmp)? undefined: info.bookmarkId;
			browser.storage.local.set(blub);
		}
	}
});

browser.menus.onShown.addListener(async function(info/*, tab*/) {
	if(info.bookmarkId ) {
		const bmn = (await browser.bookmarks.get(info.bookmarkId))[0];
		if(!bmn.url) {
			let tmp = await browser.storage.local.get(extname);
			if (tmp) { tmp = tmp[extname]; }
			browser.menus.update(extname, {visible: true, checked: (tmp === info.bookmarkId)});
		}else{
			browser.menus.update(extname, {visible: false, checked: false});
		}
	}
	browser.menus.refresh();
});

// register listeners
browser.browserAction.onClicked.addListener(onBrowserActionClicked);
browser.tabs.onUpdated.addListener(onTabsUpdated, filter);
browser.tabs.onRemoved.addListener(onTabsRemoved);

