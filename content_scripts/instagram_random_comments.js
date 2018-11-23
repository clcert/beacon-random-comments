(function() {
	if (window.hasRun) {
		return;
	}

	window.hasRun = true;

	console.log("received message");

	var intervalClickerId;
	let commentsList = [];

	// Auxiliary functions

	/**
	 * Extracts the comment of the given index from the Instagram
	 * post HTML
	*/
	const commentGetter = (index) => {
		const fixedIndex = index + 2;
		const base = "article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1) > li:nth-child(" + fixedIndex.toString() + ")";
		const stringComment = document.querySelector(base + "> div > div > div > span").innerHTML;
		const stringAuthor = document.querySelector(base + " > div > div > div > h3 > a").innerHTML;
		return {author: stringAuthor, comment: stringComment};
	}

	/**
	 * Clicks if the button to "Load more comments" still exists in
	 * the Instagram Post, else save the comments in the commentsList
	*/
	const clicker = () => {
		try {
			document.querySelector("article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1) > li:nth-child(2) > button:nth-child(1)").click();
		} catch (err) {
			console.log("Finished comments loading");
			clearInterval(intervalClickerId);
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

	browser.runtime.onMessage.addListener((message) => {
		console.log(message);
		if (message.command === "choose") {
			console.log("Starting comments loading...");

			const  timeInterval = 500;
			intervalClickerId = window.setInterval(clicker, timeInterval);
			
			console.log(commentsList);
		}
	});
})();
