
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

			jsonFromUrl("https://beacon.clcert.cl/beacon/2.0/pulse/last", (err, data) => {
				let seed = null;
				if (err) {
					console.log(err);
				} else {
					seed = JSON.parse(data).pulse.outputValue;
					console.log(seed);
				}

				function sendMessage(tabs)  {
					browser.tabs.sendMessage(tabs[0].id, {
						command: "seed",
						seed: seed,
						error: err
					});
				}

				browser.tabs.query({active: true, currentWindow: true})
					.then(sendMessage);
			});
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
			console.log("unloaded state, listening clicks to load...")
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


function jsonFromUrl(url, callback) {
	let request = new XMLHttpRequest();
	request.open("GET", "https://cors-anywhere.herokuapp.com/" + url, true);
	request.onload = function() {
		const status = request.status;
		if (status == 200) {
			callback(null, request.responseText);
		} else {
			callback(status, request.response);
		}
	}
	request.send();
}

browser.tabs.query({active: true, currentWindow: true})
	.then(askForState)
	.catch(reportExecuteScriptError);


