(function() {
	if (window.hasRun) {
		return;
	}

	window.hasRun = true;
	window.popupState = "unloaded";

	var intervalClickerId;
	let loadingGifUrl;
	let totalComments = 0;

	/**
	 * Extracts the comment of the given index from the Instagram
	 * post HTML
	*/
	function commentGetter(index) {
		index += 2;
		const base = "article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1) > li:nth-child(" + index.toString() + ")";
		const stringComment = document.querySelector(base + "> div > div > div > span").innerHTML;
		const stringAuthor = document.querySelector(base + " > div > div > div > h3 > a").innerHTML;
		return {author: stringAuthor, comment: stringComment};
	}


	function showComentsLoadingIcon() {
		if (!window.displayState) {
			window.displayState = "block";
		}

		if (window.displayState === "block") {
			let comments =  document.querySelector("article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1)");
			comments.style.display = "none";
			window.displayState = "none";
			
			let loadingIcon = document.createElement("img");
			loadingIcon.setAttribute("src", loadingGifUrl);
			loadingIcon.className = "loading-gif";
			comments.parentNode.insertBefore(loadingIcon, comments.nextSibling);
		}
	}	


	function hideCommentsLoadingIcon() {
		if (window.displayState === "none") {
			let comments =  document.querySelector("article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1)");
			comments.style.display = "block";
			comments.nextSibling.style.display = "none";

			window.displayState = "block";	
			window.popupState = "loaded";		
		}
	}

	function notifyLoad(totalComments) {
		browser.runtime.sendMessage({
			isLoaded: true,
			totalComments: totalComments
		});
	}

	/**
	 * Clicks if the button to "Load more comments" still exists in
	 * the Instagram Post, else save the comments in the commentsList
	*/
	function clicker() {
		try {
			document.querySelector("article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1) > li:nth-child(2) > button:nth-child(1)").click();	
			showComentsLoadingIcon();
			
		} catch (err) {
			clearInterval(intervalClickerId);

			
			hideCommentsLoadingIcon();

			while (true) {
				try {
					commentGetter(totalComments);
					totalComments++;
				} catch(err) {
					break;
				}
			}
			console.log(totalComments);
			notifyLoad(totalComments);
		}
	};	


	function displayComment(commentId) {
		commentId++;
		if (!window.highlighted) {
			window.highlighted = commentId;
		}

		const base = "article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1) > li:nth-child(";

		let highlightedComment = document.querySelector(base + window.highlighted.toString() + ")");
		highlightedComment.style.backgroundColor = "";

		window.highlighted = commentId;

		let comment = document.querySelector(base + commentId.toString() + ")");
		comment.style.backgroundColor = "yellow";
		comment.scrollIntoView({
			behavior: 'smooth'
		});
		document.querySelector("main").scrollIntoView();

	}


	/**
 	 * Makes the request to load the comments and choose randomly
 	 * using the beacon output
	*/
	browser.runtime.onMessage.addListener((message) => {
		if (message.command === "load") {
			const  timeInterval = 500;
			loadingGifUrl = message.loadingUrl;
			intervalClickerId = window.setInterval(clicker, timeInterval);

		} else if (message.command === "choose") {
			displayComment(message.comment);
		
		} else if (message.command === "state") {
			browser.runtime.sendMessage({
				state: window.popupState,
				totalComments: totalComments
			});
		}
	});
})();
