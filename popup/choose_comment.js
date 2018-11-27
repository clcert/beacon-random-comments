

function listenForClicks() {
	document.querySelector("#chooser").addEventListener("click", (e) => {

		function loadComments(tabs) {
			let url = browser.extension.getURL("gif/loading.gif");
			browser.tabs.sendMessage(tabs[0].id, {
				command: "choose",
				loadingUrl: url
			}).then(response => {
				document.querySelector("#chooser").innerHTML = "Sortear";
			});
		}

		function reportError(error) {
			console.error(error);
		}

		browser.tabs.query({active: true, currentWindow: true})
			.then(loadComments)
			.catch(reportError);
	});
}

function reportExecuteScriptError(error) {
  	document.querySelector("#popup-content").classList.add("hidden");
  	document.querySelector("#error-content").classList.remove("hidden");
	console.error(`Failed to execute beastify content script: ${error.message}`);
}


/**
 * Given a string representing an url, gets its JSON content
*/
function jsonFromUrl(url){
    var request = new XMLHttpRequest(); // a new request
    request.open("GET", url, false);
    request.send(null);
    return JSON.parse(request.responseText);          
}

browser.tabs.executeScript({file: "/content_scripts/instagram_random_comments.js"})
	.then(listenForClicks)
	.catch(reportExecuteScriptError);
