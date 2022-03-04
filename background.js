
//const temporary = browser.runtime.id.endsWith('@temporary-addon'); // debugging?
const manifest = browser.runtime.getManifest();
const extname = manifest.name;

const postfix = '#trackmark';
let marks = {};

/*
const debug = (msg) => {
	console.debug(`domain-auto-updating-bookmark::debug: ${msg}`);
}
*/

function onRemove (tabId, removeInfo) {
	if (marks[tabId]) {
		//console.debug(`stopped tracking for tabId: ${tabId}`);
		delete marks[tabId];
	}
}

async function onUpdate (tabId, changeInfo, tabInfo) {

	const tabUrl = tabInfo.url;
	const tabTitle = tabInfo.title;

	if(tabUrl.endsWith(postfix)){
		//console.debug(`started tracking for tabId: ${tabId}`);
		marks[tabId] = tabUrl.slice(0, -postfix.length);
		return;
	}

	if( marks[tabId] && marks[tabId] !== tabUrl ){

		const n_url = new URL(tabUrl);
		const p_url = new URL(marks[tabId]);

		// check if we are on the same origin
		if( n_url.origin !== p_url.origin ) {
			onRemove(tabId);
			return;
		}

		//console.debug(`tab: ${tabId} - url changed from ${marks[tabId]} to ${tabUrl}`);

		const bmark = await browser.bookmarks.search({ url: marks[tabId] + postfix });
		if(bmark.length > 0) {
			browser.bookmarks.update(bmark[0].id, { title: "auto: " + tabTitle, url: tabUrl + postfix });
			marks[tabId] = tabUrl;
		}
	}
}

async function onClicked (tab) {
    let tmp;
    try {
        tmp = await browser.storage.local.get(extname);
        tmp = tmp[extname];
    }catch(e){
        tmp = undefined;
    }
    browser.bookmarks.create({ parentId: tmp, title: "auto:" + tab.title, url: tab.url + postfix });
    browser.tabs.update(tab.id, { url: tab.url + postfix });
}


browser.menus.create({
	id: extname,
	title: 'Check to save DAU bookmarks here',
	type: "radio",
	contexts: ["bookmark"],
	visible: false,
	checked: false,
	onclick: async function(info, tab) {
		if(info.bookmarkId ) {
			//blub = { 'startup-tabs': info.bookmarkId }

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

browser.menus.onShown.addListener(async function(info, tab) {
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

const filter = {
    urls: ["<all_urls>"],
    properties: ["url"]
}


// add listeners
browser.browserAction.onClicked.addListener(onClicked);
browser.tabs.onUpdated.addListener(onUpdate, filter);
browser.tabs.onRemoved.addListener(onRemove);

