
const postfix = '#autoupdate';
let marks = {};

/*
const debug = (msg) => {
	console.debug(`domain-auto-updating-bookmark::debug: ${msg}`);
}
*/

const onRemove = (tabId, removeInfo) => {
	if (marks[tabId]) {
		//debug(`stopped tracking for tabId: ${tabId}`);
		delete marks[tabId];
	}
}

const onUpdate = async (tabId, changeInfo, tabInfo) => {

	const tabUrl = tabInfo.url;
	const tabTitle = tabInfo.title;

	if(tabUrl.endsWith(postfix)){
		//debug(`started tracking for tabId: ${tabId}`);
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

		//debug(`tab: ${tabId} - url changed from ${marks[tabId]} to ${tabUrl}`);

		const bmark = await browser.bookmarks.search({ url: marks[tabId] + postfix });
		if(bmark.length > 0) {
			browser.bookmarks.update(bmark[0].id, { title: "auto: " + tabTitle, url: tabUrl + postfix });
			marks[tabId] = tabUrl;
		}
	}
}

const onClicked = (tab) => {
  browser.bookmarks.create({ title: "auto:" + tab.title, url: tab.url + postfix });
  browser.tabs.update(tab.id, { url: tab.url + postfix });
}

// add listeners
browser.browserAction.onClicked.addListener(onClicked);
browser.tabs.onUpdated.addListener(onUpdate); 
browser.tabs.onRemoved.addListener(onRemove); 

