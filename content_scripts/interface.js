'use strict';

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

    window.elements = elements;


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
                if (message.command === "state") {
                    debugLog("received state request");
                    if (elements.currentUrl) {
                        if (elements.currentUrl !== message.url) {
                            debugLog("url changed to:", message.url);
                            restartParams();
                            elements.currentUrl = message.url;
                            currentState.removeListener();
                            currentState = new LoadWaiter(self);
                            currentState.init();
                        }
                    } else {
                        debugLog("url still being the same: ", message.url);
                        elements.currentUrl = message.url;
                    }

                    drawJSON.post_url = message.url;

                    const comment = elements.commentsList ? getComment(elements.currentCommentID) : {user: "no user yet", comment: "no comment yet"};

                    // TODO: Modify according site user cookie
                    let logged = getCookie("ds_user_id") ? true : false;

                    chrome.runtime.sendMessage({
                        command: "state-response",
                        state: getStateName(),
                        user: comment.user,
                        comment: comment.comment,
                        counter: elements.popupRequests,
                        url: elements.verificationURL,
                        logged: logged
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

        // let requestToURL = (url, callback) => {
        //     let request = new XMLHttpRequest();
        //     request.open("GET", url, true);
        //     request.onload = function () {
        //         const status = request.status;
        //         if (status === 200) {
        //             callback(null, request.response);
        //         } else {
        //             callback(status, null);
        //         }
        //     };
        //     request.send();
        // };

        let requestSeed = () => {
            function seedHandler(message) {
                if (message.command === "seed-json") {
                    elements.seed = message.data.pulse.outputValue;
                    drawJSON.pulse_url = message.data.pulse.uri;

                    debugLog("seed is", elements.seed);
                    Math.seedrandom(elements.seed);

                    removeListener();
                    handler.change(new CommentsLoader(handler));

                }
            }

            function removeListener() {
                chrome.runtime.onMessage.removeListener(seedHandler);
            }

            try {
                // debugLog("inside requestSeed function");
                // requestToURL(elements.beaconURL, (err, data) => {
                //     debugLog("received Beacon response...");
                //     if (err) {
                //         console.error(err);
                //         chrome.runtime.sendMessage({
                //             command: "failed",
                //             detail: err
                //         });
                //
                //     } else {
                //         try {
                //             elements.seed = JSON.parse(data).pulse.outputValue;
                //
                //             // Saves pulse URI
                //             drawJSON.pulse_url = JSON.parse(data).pulse.uri;
                //
                //             debugLog("seed is", elements.seed);
                //             Math.seedrandom(elements.seed);
                //             handler.change(new CommentsLoader(handler));
                //         } catch (e) {
                //             console.error(e);
                //             chrome.runtime.sendMessage({
                //                 command: 'failed',
                //                 detail: e
                //             });
                //         }
                //     }
                // });
                chrome.runtime.sendMessage({
                    command: "get-seed"
                });



                chrome.runtime.onMessage.addListener(seedHandler);
            } catch (err) {
                console.log(err);
            }
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
                    const commentsCount = clickToLoadComments();
                    chrome.runtime.sendMessage({
                        command: "comments-count",
                        commentsCount: commentsCount
                    })
                } catch(err) {
                    debugLog("loaded comments...");
                    clearInterval(intervalClickerId);
                    saveComments();
                }
            }

            intervalClickerId = window.setInterval(clicker, 500);
        };

        let saveComments = () => {
            debugLog("filtering and saving the comments");
            try {
                elements.commentsList = getAllDOMComments();
                drawJSON.comments = getAllComments();
                drawJSON.host = getHostComment().host;
                drawJSON.post_comment = getHostComment().post_comment;
                drawJSON.comments_number = drawJSON.comments.length;
            } catch (e) {
                reportError(e);
            }

            handler.change(new GetCommentWaiter(handler));
            chrome.runtime.sendMessage({
                command: "loaded",
                commentsCount: getCommentsCount()
            });
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
            // let xhr = new XMLHttpRequest();
            // xhr.open("POST", elements.serverURL, true);
            // xhr.setRequestHeader("Content-Type", "application/json");
            // xhr.onreadystatechange = function () {
            //     if (xhr.readyState === 4 && xhr.status === 200) {
            //         debugLog("received URL by server");
            //         elements.verificationURL = xhr.responseText;
            //
            //         handler.change(new Finished(handler));
            //     }
            // };
            // xhr.send(JSON.stringify(drawJSON));

            function winnerURLListener(message) {
                if (message.command === "winner-url") {
                    elements.verificationURL = message.url;
                    handler.change(new Finished(handler));
                    removeWinnerListener();
                }
            }

            function removeWinnerListener() {
                chrome.runtime.onMessage.removeListener(winnerURLListener);
            }

            debugLog("asking for winner url");
            chrome.runtime.sendMessage({
                command: "send-winner",
                winnerJSON: drawJSON
            });

            chrome.runtime.onMessage.addListener(winnerURLListener);
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
            debugLog("sending winner to popup...");
            chrome.runtime.sendMessage({
                command: "verification",
                url: elements.verificationURL
            });
        }
    };


    let stateHandler = new StateHandler();
}) ();