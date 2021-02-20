
const extId = 'trackmark';

function onError(error) {
	console.log(`${extId}::Error: ${error}`);
}

let amarks = {};

function onRemove(tabId, removeInfo) {
	// remove tab from active tracking on close 
	if (amarks[tabId]) {
		delete amarks[tabId];
		console.log("Stopped Tracking: " + tabId );
	}

}

async function onUpdate(tabId, changeInfo, tabInfo) {
	//
	console.log(extId, "-------------------");
	if(changeInfo.url) {

		// if url contains ?track=1 => save tabid
		if( changeInfo.url.endsWith('?track=1') ) {
			amarks[tabId] = changeInfo.url;
			console.log("Started Tracking: " + tabId );
		} else
			// any navigation change on a saved tabid ... changes the bookmark 
			if(amarks[tabId] !== changeInfo.url){
				console.log("Tab: " + tabId + 
					" URL changed from " + amarks[tabId] + 
					" to " + changeInfo.url);
				
				console.log('// save new url into the previous bookmark');
				const bmark = await browser.bookmarks.search({url: amarks[tabId]});
				//console.log('bmark', bmark[0]);
				console.log(changeInfo);

				//console.log('tabInfo.title:', tabInfo);
				browser.bookmarks.update(bmark[0].id, { title: tabInfo.title, url: changeInfo.url + "?track=1"});
				amarks[tabId] = changeInfo.url + "?track=1";
				
				// feat: neuen bookmark anlegen, wenn keiner existiert
			}
	}
}

// add listeners
browser.tabs.onUpdated.addListener(onUpdate); 
browser.tabs.onRemoved.addListener(onRemove); 

