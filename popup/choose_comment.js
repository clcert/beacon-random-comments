
function listenForClicks() {
	document.querySelector("#chooser").addEventListener("click", (e) => {

		function chooseComment(tabs) {
			browser.tabs.sendMessage(tabs[0].id, {
				command: 'choose'
			});
		}

		function reportError(error) {
			console.error(error);
		}

		browser.tabs.query({active: true, currentWindow: true})
			.then(chooseComment)
			.catch(reportError);
	});
}

function reportExecuteScriptError(error) {
  	document.querySelector("#popup-content").classList.add("hidden");
  	document.querySelector("#error-content").classList.remove("hidden");
	console.error(`Failed to execute beastify content script: ${error.message}`);
}

browser.tabs.executeScript({file: "/content_scripts/instagram_random_comments.js"})
	.then(listenForClicks)
	.catch(reportExecuteScriptError);
