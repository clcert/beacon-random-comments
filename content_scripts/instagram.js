(function() {
    if (window.hasRun) {
        return;
    }
    window.hasRun = true;

    let elements = {
        debugging: true,
        beaconURL:  "https://beacon.clcert.cl/beacon/2.0/pulse/last",
        serverURL: "http://ec2-18-219-248-89.us-east-2.compute.amazonaws.com/",
        verificationURL: null,
        commentsDiv: null,
        commentsList: null,
        currentCommentID: 0,
        currentUrl: null,
        loadingGifURL: null,
        popupRequests: 0,
        seed: null

    };


    let drawJSON = {
        host: null,
        post_comment: null,
        draw_date: null,
        comments_number: null,
        pulse_url: null,
        post_url: null,
        retries: 0,
        selected_comment: {
            user: null,
            comment: null
        },
        comments: []
    };


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


    function restartParams() {
        elements.commentsDiv = null;
        elements.commentsList = null;
        elements.currentCommentID = 0;
        elements.loadingGifURL = null;
        elements.popupRequests = 0;
        elements.seed = null;
    }


    /**
     *
     * @param min
     * @param max
     * @returns {number}
     */
    function randInt(min, max) {
        return Math.floor(Math.random()*(max-min+1)+min);
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


    /**
     *
     * @constructor
     */
    let StateHandler = function() {
        let currentState = new LoadWaiter(this);
        currentState.init();

        this.change = (state) => {
            currentState = state;
            currentState.init();
        };

        let listenForStateRequest = (self) => {
            debugLog("listening to send state...");
            function handleRequest(message) {
                debugLog("received state request");
                if (message.command === "state") {
                    if (elements.currentUrl) {
                        if (elements.currentUrl !== message.url) {
                            debugLog("url changed");
                            restartParams();
                            elements.currentUrl = message.url;
                            currentState.removeListener();
                            currentState = new LoadWaiter(self);
                            currentState.init();
                        }
                    } else {
                        elements.currentUrl = message.url;
                    }

                    drawJSON.post_url = message.url;

                    const comment = getComment(elements.currentCommentID);
                    chrome.runtime.sendMessage({
                        command: "state-response",
                        state: getStateName(),
                        user: comment.user,
                        comment: comment.comment,
                        counter: elements.popupRequests,
                        url: elements.verificationURL
                    });
                    debugLog("sent state", getStateName());
                }
            }

            debugLog("listening to send state...");
            chrome.runtime.onMessage.addListener(handleRequest);
        };

        let getStateName = () => {
            return currentState.getName();
        };

        listenForStateRequest(this);
    };


    /**
     * 
     * @param handler
     * @constructor
     */
    let LoadWaiter = function (handler) {
        this.handler = handler;
        let listener;

        this.init = () => {
            debugLog("Waiting to load...");
            listenToLoad(this);
        };

        this.getName = () => {
            return "load-waiter";
        };

        this.removeListener = () => {
            if (listener) {
                chrome.runtime.onMessage.removeListener(listener);
                listener = null;
            }
        };

        let listenToLoad = (self) => {
            function handleLoadRequest(message) {
                if (message.command === "load") {
                    // Remove the load request listener.
                    self.removeListener();

                    debugLog("Start loading...");
                    elements.loadingGifURL = message.loadingURL;

                    showCommentsLoadingIcon();
                    debugLog(message.loadingURL);

                    handler.change(new SeedRequester(handler));
                }
            }

            listener = handleLoadRequest;
            chrome.runtime.onMessage.addListener(listener);
        };

    };


    /**
     *
     * @param handler
     * @constructor
     */
    let SeedRequester = function (handler) {
        this.handler = handler;

        this.init = () => {
            debugLog("Requesting seed...");
            requestSeed();
        };

        this.getName = () => {
            return "seed-requester";
        };

        this.removeListener = () => {};

        let requestToURL = (url, callback) => {
            let request = new XMLHttpRequest();
            request.open("GET", url, true);
            request.onload = function () {
                const status = request.status;
                if (status === 200) {
                    callback(null, request.response);
                } else {
                    callback(status, null);
                }
            };
            request.send();
        };

        let requestSeed = () => {
            requestToURL(elements.beaconURL, (err, data) => {
                debugLog("received request...");
                if (err) {
                    console.error(err);
                    chrome.runtime.sendMessage({
                        command: "failed",
                        detail: err
                    });
                    
                } else {
                    try {
                        elements.seed = JSON.parse(data).pulse.outputValue;

                        // Saves pulse URI
                        drawJSON.pulse_url = JSON.parse(data).pulse.uri;

                        debugLog("seed is", elements.seed);
                        Math.seedrandom(elements.seed);
                        handler.change(new CommentsLoader(handler));
                    } catch (e) {
                        console.error(e);
                        chrome.runtime.sendMessage({
                            command: 'failed',
                            detail: e
                        });
                    }
                }
            });
        };
    };


    /**
     *
     * @param handler
     * @constructor
     */
    let CommentsLoader = function (handler) {
        this.handler = handler;

        this.init = () => {
            debugLog("loading comments...");
            loadComments();
        };

        this.getName = () => {
            return "comments-loader";
        };

        this.removeListener = () => {};

        let intervalClickerId = null;
        let loadComments = () => {
            function clicker() {
                try {
                    document.querySelector("article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1) > li:nth-child(2) > button:nth-child(1)").click();
                } catch(err) {
                    debugLog("loaded comments...");
                    clearInterval(intervalClickerId);
                    saveComments();
                }
            }

            intervalClickerId = window.setInterval(clicker, 500);
        };

        let saveComments = () => {
            let hostComment = getHostComment();
            drawJSON.host = hostComment.host;
            drawJSON.post_comment = hostComment.post_comment;

            elements.commentsList = document.querySelectorAll("article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1) > li");
            elements.commentsList = Array.from(elements.commentsList);
            elements.commentsList.shift();

            // Remove host comments from comments list
            for (let i = elements.commentsList.length-1; i >= 0; i--) {
                const userComment = getComment(i);
                if (userComment.user === hostComment.host) {
                    elements.commentsList.splice(i, 1);
                }
            }

            // Saves final comments number in drawJSON
            drawJSON.comments_number = elements.commentsList.length;

            // Saves comments in drawJSON
            for (let i = 0; i < elements.commentsList.length; i++) {
                drawJSON.comments.push(getComment(i));
            }

            chrome.runtime.sendMessage({
                command: "loaded"
            });

            handler.change(new GetCommentWaiter(handler));
        };
    };


    /**
     *
     * @param handler
     * @constructor
     */
    let GetCommentWaiter = function(handler) {
        this.handler = handler;
        let listener;

        this.init = () => {
            debugLog("waiting for get comment request...");
            listenForGetCommentRequest(this);
        };

        this.getName = () => {
            return "get-comment-waiter";
        };

        this.removeListener = () => {
            if (listener) {
                chrome.runtime.onMessage.removeListener(listener);
                listener = null;
            }
        };

        let listenForGetCommentRequest = (self) => {
            function handleGetRequest(message) {
                if (message.command === "get") {
                    debugLog("received get comment request...");
                    self.removeListener();
                    setCommentColor(elements.currentCommentID, "");

                    showCommentsLoadingIcon();

                    elements.currentCommentID = randInt(0, elements.commentsList.length-1);
                    elements.popupRequests++;

                    debugLog("sending comment,,,");
                    const comment = getComment(elements.currentCommentID);
                    chrome.runtime.sendMessage({
                        command: "chosen",
                        user: comment.user,
                        comment: comment.comment,
                        counter: elements.popupRequests
                    });

                    handler.change(new DisplayComment(handler));

                } else if (message.command === "finish") {
                    self.removeListener();
                    drawJSON.retries = elements.popupRequests;
                    drawJSON.selected_comment = getComment(elements.currentCommentID);
                    drawJSON.draw_date = new Date().toISOString();

                    debugLog(JSON.stringify(drawJSON));
                    handler.change(new WinnerSender(handler));
                }
            }

            listener = handleGetRequest;
            chrome.runtime.onMessage.addListener(listener);
        };

    };

    /**
     *
     * @param handler
     * @constructor
     */
    let DisplayComment = function (handler) {
        this.handler = handler;
        let listener;

        this.init = () => {
            debugLog("listening to display...");
            listenForDisplayRequest(this);
        };

        this.getName = () => {
            return "display-comment";
        };

        this.removeListener = () => {
            if (listener) {
                chrome.runtime.onMessage.removeListener(listener);
                listener = null;
            }
        };

        let listenForDisplayRequest = (self) => {
            function handleDisplayRequest(message) {
                if (message.command === "display") {
                    self.removeListener();
                    hideCommentsLoadingIcon();
                    debugLog("displaying...");
                    debugLog("displayed comment", elements.currentCommentID);
                    setCommentColor(elements.currentCommentID, "yellow");
                    scrollIntoComment(elements.currentCommentID);
                    handler.change(new GetCommentWaiter(handler));
                }
            }

            listener = handleDisplayRequest;
            chrome.runtime.onMessage.addListener(listener);
        };


        let scrollIntoComment = (i) => {
            let comment = elements.commentsList[i];
            comment.scrollIntoView({
                behavior: 'smooth'
            });
            //document.querySelector("main").scrollIntoView();
        };
    };


    let WinnerSender = function(handler) {
        this.handler = handler;

        this.init = () => {
            sendWinnerJSON();
        };

        this.getName = () => {
            return "json-winner-request";
        };

        this.removeListener = () => {};

        let sendWinnerJSON = function() {
            debugLog("sending winner to server...");
            let xhr = new XMLHttpRequest();
            xhr.open("POST", elements.serverURL, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    debugLog("received URL by server");
                    elements.verificationURL = xhr.responseText;

                    handler.change(new Finished(handler));
                }
            };
            xhr.send(JSON.stringify(drawJSON));
        };
    };


    let Finished = function(handler) {
        this.handler = handler;

        this.init = () => {
            sendWinnerURL();
        };

        this.getName = () => {
            return "finished";
        };

        this.removeListener = () => {};

        let sendWinnerURL = () => {
            chrome.runtime.sendMessage({
                command: "verification",
                url: elements.verificationURL
            });
        }
    };


    let stateHandler = new StateHandler();
}) ();