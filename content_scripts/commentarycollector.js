

var intervalClickerId;
const  timeInterval = 500;

// Auxiliary functions
const clicker = () => {
	try {
		document.querySelector("article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1) > li:nth-child(2) > button:nth-child(1)").click();
	} catch (err) {
		console.log("Finished comments loading");
		clearInterval(intervalClickerId);
	}
};

const commentGetter = (index) => {
	const fixedIndex = index + 2;
	const base = "article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1) > li:nth-child(" + fixedIndex.toString() + ")";
	const stringComment = document.querySelector(base + "> div > div > div > span").innerHTML;
	const stringAuthor = document.querySelector(base + " > div > div > div > h3 > a").innerHTML;
	return {author: stringAuthor, comment: stringComment};
}


// Main Functions
const commentsLoader = () => {
	console.log("Starting comments loading...");
	intervalClickerId = window.setInterval(clicker, timeInterval);
	return;
};

const commentsSaver = () => {
	console.log("Starting saving comments...");

	let comments = []; 
	let i = 0;
	while (true) {
		try {
			const comment = commentGetter(i);
			comments.push(comment);
			i++;
		} catch (err) {
			break;
		}
	}

	console.log("Finished.");
	return comments;
}
