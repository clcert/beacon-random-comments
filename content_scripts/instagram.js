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
        const user = elements.commentsList[i].querySelector("div > div > div > h3 > a").innerHTML;
        const comment = elements.commentsList[i].querySelector("div > div > div > span").innerHTML;
        return {user: user, comment: comment};
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
            loadComments();
        };


        let intervalClickerId = null;
        let loadComments = () => {
            function clicker() {
                try {
                    document.querySelector("article > div:nth-child(3) > div:nth-child(3) > ul:nth-child(1) > li:nth-child(2) > button:nth-child(1)").click();
                } catch(err) {
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

            handler.change(new DisplayComment(handler));
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
            listenForRequest();
        };

        let listenForRequest = () => {
            function handleRequest(message) {
                if (message.command === "get") {
                    setCommentColor(elements.currentCommentID, "");

                    elements.currentCommentID = randInt(0, elements.commentsList.length-1);
                    elements.popupRequests++;

                    const comment = getComment(elements.currentCommentID);
                    browser.runtime.sendMessage({
                        command: "chosen",
                        user: comment.user,
                        comment: comment.comment,
                        counter: elements.popupRequests
                    });

                } else if (message.command === "display") {
                    setCommentColor(elements.currentCommentID, "yellow");
                    scrollIntoComment(elements.currentCommentID);
                }
            }

            browser.runtime.onMessage.addListener(handleRequest);
        };

        let setCommentColor = (i, color) => {
            let comment = elements.commentsList[i];
            comment.style.backgroundColor = color;
        };

        let scrollIntoComment = (i) => {
            let comment = elements.commentsList[i];
            comment.scrollIntoView({
                behavior: 'smooth'
            });
            document.querySelector("main").scrollIntoView();
        };
    };

    new StateHandler();
}) ();