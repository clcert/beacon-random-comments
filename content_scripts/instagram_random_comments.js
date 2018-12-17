(function() {
	if (window.hasRun) {
		return;
	}

	window.hasRun = true;

	const BEACON_URL = "https://beacon.clcert.cl/beacon/2.0/pulse/last";
	let COMMENTS_DISPLAY_STATE = "block";
	let COMMENTS_STATE = "unloaded";
	let CURRENT_WORKING_URL;
	let HIGHLIGHTED_COMMENT;
	let INTERVAL_CLICKER_ID;
	let LOADING_GIF_URL;
	let SEED;
	let TOTAL_COMMENTS = 0;
	
	function resetParameters() {	
		COMMENTS_DISPLAY_STATE = "block";
		COMMENTS_STATE = "unloaded";
		CURRENT_WORKING_URL = null;
		HIGHLIGHTED_COMMENT = null;
		INTERVAL_CLICKER_ID = null;
		LOADING_GIF_URL = null;
		SEED = null;
		TOTAL_COMMENTS = 0;
	
		return;
	}


	function getSeedState() {
		let seed = "unloaded";
		if (SEED) {
			seed = SEED;
		} else if (COMMENTS_DISPLAY_STATE === "none") {
			seed = "requested";
		}
		return seed;
	}

	/**
	 * Extracts the comment of the given index from the Instagram
	 * post HTML
	*/
	function commentGetter(index) {
		index += 2;
		const base = "article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1) > li:nth-child(" + index.toString() + ")";
		const stringComment = document.querySelector(base + "> div > div > div > div > span").innerHTML;
		const stringAuthor = document.querySelector(base + " > div > div > div > div > h3 > a").innerHTML;
		return {author: stringAuthor, comment: stringComment};
	}


	function showComentsLoadingIcon() {
		if (COMMENTS_DISPLAY_STATE === "block") {
			let comments =  document.querySelector("article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1)");
			comments.style.display = "none";
			COMMENTS_DISPLAY_STATE = "none";
			
			let loadingIcon = document.createElement("img");
			loadingIcon.setAttribute("src", LOADING_GIF_URL);
			loadingIcon.className = "loading-gif";
			comments.parentNode.insertBefore(loadingIcon, comments.nextSibling);
		}
	}	


	function hideCommentsLoadingIcon() {
		if (COMMENTS_DISPLAY_STATE === "none") {
			let comments =  document.querySelector("article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1)");
			comments.style.display = "block";
			comments.nextSibling.style.display = "none";

			COMMENTS_DISPLAY_STATE = "block";	
		}
	}

	function notifyLoad() {
		browser.runtime.sendMessage({
			isLoaded: true
		});
	}

	/**
	 * Clicks if the button to "Load more comments" still exists in
	 * the Instagram Post, else save the comments in the commentsList
	*/
	function clicker() {
		try {
			document.querySelector("article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1) > li:nth-child(2) > button:nth-child(1)").click();	
		} catch (err) {
			clearInterval(INTERVAL_CLICKER_ID);

			while (true) {
				try {
					commentGetter(TOTAL_COMMENTS);
					TOTAL_COMMENTS++;
					} catch(err) {
					break;
				}
			}

			if (SEED) {
				hideCommentsLoadingIcon();	
				notifyLoad();
				displayComment(randInt(1, TOTAL_COMMENTS));
			}
			COMMENTS_STATE = "loaded";
			console.log("loaded comments");
		}
	};	


	function displayComment(commentId) {
		console.log("el comment id es ", commentId);
		commentId++;
		if (!HIGHLIGHTED_COMMENT) {
			HIGHLIGHTED_COMMENT = commentId;
		}

		const base = "article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1) > li:nth-child(";

		let highlightedComment = document.querySelector(base + HIGHLIGHTED_COMMENT.toString() + ")");
		highlightedComment.style.backgroundColor = "";

		HIGHLIGHTED_COMMENT = commentId;

		let comment = document.querySelector(base + commentId.toString() + ")");
		comment.style.backgroundColor = "yellow";
		comment.scrollIntoView({
			behavior: 'smooth'
		});
		document.querySelector("main").scrollIntoView();

	}	

	function requestBeaconSeed() {
		function jsonFromUrl(url, callback) {
			let request = new XMLHttpRequest();
			request.open("GET", url, true);
			request.onload = function() {
				const status = request.status;
				if (status === 200) {
					callback(null, request.responseText);
				} else {
					callback(status, null);
				}
			}
			request.send();

			console.log("requested seed");
		}

		function jsonRequestCallback(err, data) {
			console.log("callback executed");
			if (err) {
				console.log(err);
			} else {
				const seed = JSON.parse(data).pulse.outputValue;

				SEED = seed;
				console.log("la semilla es ", seed);
				Math.seedrandom(seed);

				if (COMMENTS_STATE === "loaded") {
					hideCommentsLoadingIcon();
					notifyLoad();
					displayComment(randInt(1, TOTAL_COMMENTS));
				}

				
			}
		}

		jsonFromUrl(BEACON_URL, jsonRequestCallback);
	}

	function randInt(min, max) {
		return Math.floor(Math.random()*(max-min+1)+min);
	}

	/**
 	 * Makes the request to load the comments and choose randomly
 	 * using the beacon output
	*/
	browser.runtime.onMessage.addListener((message) => {
		if (message.command === "load") {
			console.log("loading");

			
			LOADING_GIF_URL = message.loadingUrl;
			showComentsLoadingIcon();
			
			const  timeInterval = 500;
			INTERVAL_CLICKER_ID = window.setInterval(clicker, timeInterval);
			
			CURRENT_WORKING_URL = message.url;
			requestBeaconSeed();

		} else if (message.command === "choose") {
			console.log("escogiendo de un total de ", TOTAL_COMMENTS, " comentarios");
			displayComment(randInt(1, TOTAL_COMMENTS));
		
		} else if (message.command === "state") {
			if (message.url !== CURRENT_WORKING_URL) {
				resetParameters();
			}

			browser.runtime.sendMessage({
				state: COMMENTS_STATE,
				seed: getSeedState()
			});

		} 
	});
})();
