'use strict';

function getCookie(name) {
    let value = "; " + document.cookie;
    let parts = value.split("; " + name + "=");
    if (parts.length === 2) return parts.pop().split(";").shift();
}


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

function clickToLoadSubcomment(comment) {
    let button = comment.childNodes[1].querySelector("ul > li > div >button");
    let prev = comment.childNodes[1].querySelector("ul").childNodes.length;


    let clickerTimer = null;

    function clickSubComment(button) {
        button.click();
        let count = comment.childNodes[1].querySelector("ul").childNodes.length;
        if (count < prev) {
            clearInterval(clickerTimer);
            button.click();
        } else {
            prev = count;
        }
    }

    clickerTimer = window.setInterval(() => { clickSubComment(button) }, 500);
}


function clickToLoadComments() {
    if (getCookie("ds_user_id")) {
        let isLoading = document.querySelector("article > div:nth-child(3) > div > ul > li:last-child > div > div > svg");

        if (isLoading)
            return;

        document.querySelector("article > div:nth-child(3) > div > ul > li:last-child > div > button").click();

        // try {
        //     console.log("click");
        //     document.querySelector("article > div:nth-child(3) > div > ul > li:last-child > div > button").click();
        // } catch(e) {
            // The lines bellow allow to load replies to replies automatically
            // let allDOMComments = document.querySelectorAll("article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1) > ul");
            // console.log("TOTAL COMMENTS: ", allDOMComments.length);
            // let allSubcomments = [];
            // for (let i = 0; i < allDOMComments.length; i++) {
            //     if (allDOMComments[i].childNodes.length > 1) {
            //         allSubcomments.push(allDOMComments[i]);
            //     }
            // }
            //
            // for (let i = 0; i < allSubcomments.length; i++) {
            //     clickToLoadSubcomment(allSubcomments[i])
            // }
        //     throw new Error("Finished Loading Exception");
        // }


    } else {
        document.querySelector("article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1) > li:nth-child(2) > button:nth-child(1)").click();
    }
    return getCommentsCount();
}

function getCommentsCount() {
    if (getCookie("ds_user_id")) {
        return document.querySelectorAll("article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1) > ul").length;
    } else {
        return document.querySelectorAll("article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1) > li").length;
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
        if (getCookie("ds_user_id")) {
            const post_comment = hostComment.querySelector("div > div > div:nth-child(2) > span").textContent;
            return {host: host, post_comment: post_comment};
        }
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


function getAllDOMComments() {
    if (document.allDOMComments) {
        return document.allDOMComments;
    } else {
        const hostComment = getHostComment();
        if (getCookie("ds_user_id")) {
            document.allDOMComments = document.querySelectorAll("article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1) > ul");
        } else {
            document.allDOMComments = document.querySelectorAll("article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1) > li");
        }
        debugLog(document.allDOMComments.length);
        document.allDOMComments = Array.from(document.allDOMComments);
        document.allDOMComments.shift();

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
