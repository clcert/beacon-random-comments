(function() {
    if (window.hasRun) {
        return;
    }
    window.hasRun = true;
    console.log("INJECTED!!");

    let elements = {
        beaconURL:  "https://beacon.clcert.cl/beacon/2.0/pulse/last",
        seed: null,
        commentsList: null,
        currentCommentID: 0,
        popupRequests: 0
    };


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
     * @param i
     * @returns {{comment: string, user: string}}
     */
    function getComment(i) {
        if (elements.commentsList) {
            const user = elements.commentsList[i].querySelector("div > div > div > h3 > a").innerHTML;
            const comment = elements.commentsList[i].querySelector("div > div > div > span").innerHTML;
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

    function showComentsLoadingIcon() {
        let comments =  document.querySelector("article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1)");
        comments.style.display = "none";

        let loadingIcon = document.createElement("img");
        loadingIcon.setAttribute("src", elements.loadingGifURL);
        loadingIcon.className = "loading-gif";
        comments.parentNode.insertBefore(loadingIcon, comments.nextSibling);

    }


    function hideCommentsLoadingIcon() {
        let comments =  document.querySelector("article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1)");
        comments.style.display = "block";
        comments.nextSibling.style.display = "none";
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

        this.listenForStateRequest = () => {
            function handleRequest(message) {
                if (message.command === "state") {
                    const comment = getComment(elements.currentCommentID);
                    browser.runtime.sendMessage({
                        command: "state-response",
                        state: getStateName(),
                        user: comment.user,
                        comment: comment.comment,
                        counter: elements.popupRequests
                    });
                    console.log("sent state", getStateName());
                }
            }

            browser.runtime.onMessage.addListener(handleRequest);
        };

        let getStateName = () => {
            return currentState.getName();
        };
    };


    /**
     * 
     * @param handler
     * @constructor
     */
    let LoadWaiter = function (handler) {
        this.handler = handler;

        this.init = () => {
            console.log("Waiting to load...");
            listenToLoad();
        };

        this.getName = () => {
            return "load-waiter";
        };

        let listenToLoad = () => {
            function handleLoadRequest(message) {
                if (message.command === "load") {
                    removeLoadListener();
                    console.log("Start loading...");

                    handler.change(new SeedRequester(handler));
                }
            }

            function removeLoadListener() {
                browser.runtime.onMessage.removeListener(handleLoadRequest);
            }

            browser.runtime.onMessage.addListener(handleLoadRequest);
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
            console.log("Requesting seed...");
            requestSeed();
        };

        this.getName = () => {
            return "seed-requester";
        };

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
                console.log("received request...");
                if (err) {
                    console.error(err);
                    browser.runtime.sendMessage({
                        command: "failed",
                        detail: err
                    });
                    
                } else {
                    try {
                        elements.seed = JSON.parse(data).pulse.outputValue;
                        console.log("seed is", elements.seed);
                        Math.seedrandom(elements.seed);
                        handler.change(new CommentsLoader(handler));
                    } catch (e) {
                        console.error(e);
                        browser.runtime.sendMessage({
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
            console.log("loading comments...");
            loadComments();
        };

        this.getName = () => {
            return "comments-loader";
        };

        let intervalClickerId = null;
        let loadComments = () => {
            function clicker() {
                try {
                    document.querySelector("article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1) > li:nth-child(2) > button:nth-child(1)").click();
                } catch(err) {
                    console.log("loaded comments...");
                    clearInterval(intervalClickerId);
                    saveComments();
                }
            }

            intervalClickerId = window.setInterval(clicker, 500);
        };

        let saveComments = () => {
            elements.commentsList = document.querySelectorAll("article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1) > li");
            elements.commentsList = Array.from(elements.commentsList);
            elements.commentsList.shift();

            browser.runtime.sendMessage({
                command: "loaded"
            });

            handler.change(new GetCommentWaiter(handler));
        };
    };


    let GetCommentWaiter = function(handler) {
        this.handler = handler;

        this.init = () => {
            console.log("waiting for get comment request...");
            listenForGetCommentRequest();
        };

        this.getName = () => {
            return "get-comment-waiter";
        };

        let listenForGetCommentRequest = () => {
            function handleGetRequest(message) {
                if (message.command === "get") {
                    console.log("received get comment request...");
                    removeGetListener();
                    setCommentColor(elements.currentCommentID, "");

                    elements.currentCommentID = randInt(0, elements.commentsList.length-1);
                    elements.popupRequests++;

                    console.log("sending comment,,,");
                    const comment = getComment(elements.currentCommentID);
                    browser.runtime.sendMessage({
                        command: "chosen",
                        user: comment.user,
                        comment: comment.comment,
                        counter: elements.popupRequests
                    });

                    handler.change(new DisplayComment(handler));
                }
            }

            function removeGetListener() {
                browser.runtime.onMessage.removeListener(handleGetRequest);
            }

            browser.runtime.onMessage.addListener(handleGetRequest);
        };

    };

    /**
     *
     * @param handler
     * @constructor
     */
    let DisplayComment = function (handler) {
        this.handler = handler;

        this.init = () => {
            console.log("listening to display...");
            listenForDisplayRequest();
        };

        this.getName = () => {
            return "display-comment";
        };

        let listenForDisplayRequest = () => {
            function handleDisplayRequest(message) {
                console.log("handling wea");
                if (message.command === "display") {
                    removeDisplayListener();
                    console.log("displaying...");

                    console.log("displayed comment", elements.currentCommentID);
                    setCommentColor(elements.currentCommentID, "yellow");
                    scrollIntoComment(elements.currentCommentID);
                    handler.change(new GetCommentWaiter(handler));
                }
            }

            function removeDisplayListener() {
                browser.runtime.onMessage.removeListener(handleDisplayRequest);
            }

            browser.runtime.onMessage.addListener(handleDisplayRequest);
        };


        let scrollIntoComment = (i) => {
            let comment = elements.commentsList[i];
            comment.scrollIntoView({
                behavior: 'smooth'
            });
            document.querySelector("main").scrollIntoView();
        };
    };


    let stateHandler = new StateHandler();
    stateHandler.listenForStateRequest();

}) ();