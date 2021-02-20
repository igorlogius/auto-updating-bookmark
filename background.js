
const extId = 'trackmark';
const postfix = '#' + extId;
let marks = {};

function debug(msg) {
	console.debug(`${extId}::Debug: ${msg}`);
}


function onRemove(tabId, removeInfo) {
	if (marks[tabId]) {
		debug("Stopped Tracking: " + tabId );
		delete marks[tabId];
	}

}

async function onUpdate(tabId, changeInfo, tabInfo) {

	const tabUrl = tabInfo.url;
	const tabTitle = tabInfo.title;

	if(tabUrl.endsWith(postfix)){
		debug("Started Tracking: " + tabId);
		marks[tabId] = tabUrl.slice(0, -postfix.length);
	}else
	if( marks[tabId] && marks[tabId] !== tabUrl){
		debug("Tab: " + tabId + " URL changed from " + marks[tabId] + " to " + tabUrl);

		const bmark = await browser.bookmarks.search({url: marks[tabId]+postfix});
		if(bmark.length > 0) {
			browser.bookmarks.update(bmark[0].id, { title: "Tracked: " + tabTitle, url: tabUrl + postfix });
			marks[tabId] = tabUrl;
		}
	}
}

browser.browserAction.onClicked.addListener((tab) => {
  browser.bookmarks.create( { title: "Tracked:" + tab.title, url: tab.url + postfix});
  browser.tabs.update(tab.id, {url: tab.url + postfix});
});



// add listeners
browser.tabs.onUpdated.addListener(onUpdate); 
browser.tabs.onRemoved.addListener(onRemove); 

