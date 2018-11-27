(function() {
	if (window.hasRun) {
		return;
	}

	window.hasRun = true;

	var intervalClickerId;
	let loadingGifUrl;
	let commentsList = [];

	/**
	 * Extracts the comment of the given index from the Instagram
	 * post HTML
	*/
	function commentGetter(index) {
		const fixedIndex = index + 2;
		const base = "article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1) > li:nth-child(" + fixedIndex.toString() + ")";
		const stringComment = document.querySelector(base + "> div > div > div > span").innerHTML;
		const stringAuthor = document.querySelector(base + " > div > div > div > h3 > a").innerHTML;
		return {author: stringAuthor, comment: stringComment};
	}


	function insertLoadingGif(node) {
		let loadingIcon = document.createElement("img");
		loadingIcon.setAttribute("src", loadingGifUrl);
		loadingIcon.className = "loading-gif";
		node.parentNode.insertBefore(loadingIcon, node.nextSibling);
	}

	function removeLoadingGif(node) {
		node.nextSibling.style.display = "None";
	}

	function toggleComentsLoading() {
		if (!window.displayState) {
 			window.displayState = "block";
		}

		let comments =  document.querySelector("article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1)");
		if (window.displayState === "block") {
			comments.style.display = "none";
			window.displayState = "none";
			insertLoadingGif(comments);
			
		} else {
			comments.style.display = "block";
			window.displayState = "block";
			removeLoadingGif(comments);
		}
	}	


	/**
	 * Clicks if the button to "Load more comments" still exists in
	 * the Instagram Post, else save the comments in the commentsList
	*/
	function clicker() {
		try {
			document.querySelector("article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1) > li:nth-child(2) > button:nth-child(1)").click();
			if (!window.isLoading) {
				toggleComentsLoading();
				window.isLoading = true;
			}
		} catch (err) {
			console.log("Finished comments loading");
			clearInterval(intervalClickerId);
			toggleComentsLoading();

			console.log("Starting saving comments...");

			let i = 0;
			while (true) {
				try {
					const comment = commentGetter(i);
					commentsList.push(comment);
					i++;
				} catch (err) {
					break;
				}
			}
			console.log("Finished saving comments");
		}
	};	


	/**
 	 * Makes the request to load the comments and choose randomly
 	 * using the beacon output
	*/
	browser.runtime.onMessage.addListener((message) => {
		console.log(message);
		if (message.command === "choose") {
			const  timeInterval = 500;
			loadingGifUrl = message.loadingUrl;
			intervalClickerId = window.setInterval(clicker, timeInterval);
			console.log(commentsList);
		}
	});
})();
