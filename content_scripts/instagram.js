'use strict';


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


function getCommentsCount() {
    return document.querySelectorAll("article > div > div > ul > ul").length;
}

/**
 *
 * @returns {{post_comment: string, host: string}}
 */
function getHostComment() {
    try {
        const hostComment = document.querySelectorAll("article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1) > li")[0];
        const host = hostComment.querySelector("div > div > div > h2 > a").textContent;
        const post_comment = hostComment.querySelector("div > div > div:nth-child(2) > span").textContent;
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
    if (!document.allDOMComments) {
        getAllDOMComments();
    }
    if (i >= 0 && i < document.allComments.length) {
        return document.allComments[i];
    }

    throw new RangeError(`The argument must be between 0 and ${document.allComments.length-1}`);
}

function getAllComments() {
    if (!document.allComments) {
        getAllComments();
    }
    return document.allComments;
}


function clickToLoadComments() {
    let isLoading = document.querySelectorAll("article > div > div > ul > li > div > div > svg")[0];

    if (isLoading)
        return;

    let button = document.querySelectorAll("article > div > div > ul > li > div > button")[0];
    button.click();
    return getCommentsCount();
}


function getAllDOMComments() {
    if (document.allDOMComments) {
        return document.allDOMComments;
    } else {
        const hostComment = getHostComment();

        document.allDOMComments = document.querySelectorAll("article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1) > ul");
        debugLog(document.allDOMComments.length);
        document.allDOMComments = Array.from(document.allDOMComments);

        debugLog(`there was a total of ${document.allDOMComments.length} comments`);

        let ans = [];
        document.commentsIndices = [];
        document.allComments = [];
        for (let i = 0; i < document.allDOMComments.length; i++) {
            const currUser = document.allDOMComments[i].querySelector("div > div > div > h3 > a").textContent;
            if (currUser !== hostComment.host) {
                // Save the valid indices
                document.commentsIndices.push(i);

                // Save the valid DOM comment
                ans.push(document.allDOMComments[i]);

                // Save the valid parsed comment
                const currComment = document.allDOMComments[i].querySelector("div > div > div > span").textContent;
                document.allComments.push({user: currUser,  comment: currComment});
            }
        }

        debugLog(`remains a total of ${document.allDOMComments.length} valid comments`);
        document.allDOMComments = ans;

        return ans;
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
