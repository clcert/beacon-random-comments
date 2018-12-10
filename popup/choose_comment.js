
/**
 * General report execute error function
*/
function reportExecuteScriptError(error) {
  	document.querySelector("#popup-content").classList.add("hidden");
  	document.querySelector("#error-content").classList.remove("hidden");
	console.error(error);
}


/**
 * Loading Function's section
*/
function listenClickToLoad() {
	function sendLoadingMessage(e) {
		function loadComments(tabs) {
			let url = browser.extension.getURL("gif/loading.gif");
			browser.tabs.sendMessage(tabs[0].id, {
				command: "load",
				loadingUrl: url
			}).then(listenForLoaded);
			
			let chooser = document.querySelector("#chooser");
			chooser.removeEventListener("click", sendLoadingMessage);
			chooser.classList.remove("chooser");
			chooser.classList.add("chooser-blocked");
		}

		function reportError(error) {
			console.error(error);
		}

		browser.tabs.query({active: true, currentWindow: true})
			.then(loadComments)
			.catch(reportError);
	}

	document.querySelector("#chooser").addEventListener("click", sendLoadingMessage);
}


function listenForLoaded() {
	function reportError(error) {
		console.error(error);
	}

	function handleLoaded(message) {
		listenClickToChoose();
	}	

	browser.runtime.onMessage.addListener(handleLoaded);
}




function listenClickToChoose() {
	let chooser = document.querySelector("#chooser");
	chooser.classList.remove("chooser-blocked");
	chooser.classList.add("chooser");

	function sendChoosenMessage(e) {
		function chooseComment(tabs) {
			browser.tabs.sendMessage(tabs[0].id, {
				command: "choose"
			});
		}

		browser.tabs.query({active: true, currentWindow: true})
			.then(chooseComment);
	} 

	document.querySelector("#chooser").addEventListener("click", sendChoosenMessage);
}


function listenForState() {
	function reportError(error) {
		console.error(error);
	}


	function handleState(message) {
		if (message.state === "unloaded") {
			listenClickToLoad();

		} else if (message.state === "loaded") {
			listenClickToChoose();
		}
	}

	browser.runtime.onMessage.addListener(handleState);
}

function askForState() {
	function reportError(error) {
		console.error(error);
	}

	function sendMessage(tabs)  {
		browser.tabs.sendMessage(tabs[0].id, {
			command: "state"
		});
	}

	browser.tabs.query({active: true, currentWindow: true})
			.then(sendMessage)
			.then(listenForState)
			.catch(reportError);
}

browser.tabs.query({active: true, currentWindow: true})
	.then(askForState)
	.catch(reportExecuteScriptError);


