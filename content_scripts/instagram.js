

function debugLog() {
    if (elements.debugging) {
        let str = "";
        for (let i = 0; i < arguments.length; i++) {
            str += arguments[i].toString();
            if (i < arguments.length-1) {
                str += " ";
            }
        }
        console.log(str);
    }
}

/**
 *
 * @returns {{post_comment: string, host: string}}
 */
function getHostComment() {
    try {
        const hostComment = document.querySelectorAll("article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1) > li")[0];
        const host = hostComment.querySelector("div > div > div > h2 > a").textContent;
        const post_comment = hostComment.querySelector("div > div > div > span").textContent;
        return {host: host, post_comment: post_comment};
    } catch (e) {
        reportError(e);
    }
}

/**
 *
 * @param i
 * @returns {{comment: string, user: string}}
 */
function getComment(i) {
    if (elements.commentsList) {
        const user = elements.commentsList[i].querySelector("div > div > div > h3 > a").textContent;
        const comment = elements.commentsList[i].querySelector("div > div > div > span").textContent;
        return {user: user, comment: comment};
    } else {
        return {user: "dummy", comment: "dummy"};
    }

}


/**
 *
 * @param i
 * @param color
 */
function setCommentColor(i, color) {
    let comment = elements.commentsList[i];
    comment.style.backgroundColor = color;
}

function showCommentsLoadingIcon() {
    if (!elements.commentsDiv) {
        debugLog("adding loading icon div...");
        elements.commentsDiv = document.querySelector("article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1)");
        let loadingIcon = document.createElement("img");
        loadingIcon.setAttribute("src", elements.loadingGifURL);
        loadingIcon.className = "loading-gif";
        elements.commentsDiv.parentNode.insertBefore(loadingIcon, elements.commentsDiv.nextSibling);
    }

    elements.commentsDiv.style.display = "none";
    elements.commentsDiv.nextSibling.style.display = "block";
}


function hideCommentsLoadingIcon() {
    elements.commentsDiv.nextSibling.style.display = "none";
    elements.commentsDiv.style.display = "block";
    debugLog("hidden comments");
}
