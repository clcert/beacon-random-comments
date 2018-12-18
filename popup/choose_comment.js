
/**
 * Loading Function's section
*/
function listenClickToLoad() {
	function sendLoadingMessage(e) {
		function loadComments(tabs) {
			let gifUrl = browser.extension.getURL("gif/loading.gif");
			browser.tabs.sendMessage(tabs[0].id, {
				command: "load",
				loadingUrl: gifUrl,
				url: tabs[0].url
			}).then(listenForLoaded);
			
			let chooser = document.querySelector("#chooser");
			chooser.removeEventListener("click", sendLoadingMessage);
			chooser.classList.remove("chooser");
			chooser.classList.add("button-blocked");
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

function executeSiteScript(url) {
	browser.tabs.executeScript({file: "/content_scripts/seedrandom.min.js"});

	if (url.startsWith("https://www.instagram.com/p/")) {
		browser.tabs.executeScript({file: "/content_scripts/instagram_random_comments.js"})
			.then(listenClickToLoad);
	} else {
		console.log("no se pudo ejecutar el script");
	}
}

function requestState() {
	function reportError(error) {
		browser.tabs.query({active: true, currentWindow: true})
			.then((tabs) => {
				const url = tabs[0].url;
				executeSiteScript(url);
			});
	}

	function sendMessage(tabs) {
		browser.tabs.sendMessage(tabs[0].id, {
		command: "state",
		url: tabs[0].url
		}).catch(reportError);	
	}

	browser.tabs.query({active: true, currentWindow: true})
		.then(sendMessage)
		.then(listenForState);
}


browser.tabs.query({active: true, currentWindow: true})
	.then(requestState);
	


