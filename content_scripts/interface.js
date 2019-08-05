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
        seed: null,
        chacha: null
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
        return elements.chacha.randUInt(max-1);
    }



    function insertAfter(newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }



    function getModal(modalName) {
        let modal = document.createElement("div");
        modal.setAttribute("id","modal-base");
        modal.id = modalName;
        modal.style.display = "block";
        modal.style.position = "fixed";
        modal.style.zIndex = "1";
        modal.style.top = modal.style.left = "0";
        modal.style.height = "100%";
        modal.style.width = "80%";
        modal.style.overflow = "hidden";

        let modalContent = document.createElement("div");
        modalContent.style.backgroundColor = "#fefefe";
        modalContent.style.margin = "15% auto";
        modalContent.style.padding = "20px";
        modalContent.style.border = "1px solid #888";
        modalContent.style.width = "80%";

        let close = document.createElement("span");
        close.innerHTML = "&times;";
        close.style.color = "#aaa";
        close.style.float = "right";
        close.style.fontSize = "28px";
        close.style.fontWeight = "bold";

        modalContent.appendChild(close);
        modal.appendChild(modalContent);

        close.onclick = function () {
            modal.style.display = "none";
        };

        window.onclick = function (event) {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        };

        return modal;
    }

    function displayWelcomeModal() {
        let modal = getModal("welcome-modal");

        let modalContent = modal.childNodes[0];

        let title = document.createElement("p");
        // TODO modify text by using i18n
        title.innerText = "Bienvenido a Random Coments";
        title.style.marginTop = "3%";
        title.style.textAlign = "center";
        title.style.fontSize = "3em";
        title.style.lineHeight = "1em";

        let text = document.createElement("p");
        text.innerText = "Antes de comenzar el sorteo te recomendamos grabar el mismo, ya sea en forma de historia o " +
            "como te parezca más conveniente!";
        text.style.margin = "5%";
        text.style.fontSize = "1.5em";
        text.style.lineHeight = "1em";
        text.style.textAlign = "center";

        modalContent.appendChild(title);
        modalContent.appendChild(text);

        let lastHeader = document.getElementsByTagName("article");
        lastHeader = lastHeader[lastHeader.length-1];
        insertAfter(modal, lastHeader);
    }

    function hideDOMElement(id) {
        let htmlElement = document.getElementById(id);
        if (htmlElement) {
            htmlElement.style.display = "none";
        }
    }

    function displayFinishModal() {
        let modal = getModal("finish-modal");

        let modalContent = modal.childNodes[0];

        let title = document.createElement("p");
        // TODO modify text by using i18n
        title.innerText = "Gracias por haber utilizado Random Comments";
        title.style.marginTop = "2.5%";
        title.style.textAlign = "center";
        title.style.fontSize = "2.5em";
        title.style.lineHeight = "1em";

        let text = document.createElement("p");
        text.innerText = "Con el siguiente link tus seguidores podrán verificar tu sorteo!";
        text.style.margin = "5% 5% 2% 5%";
        text.style.fontSize = "1.5em";
        text.style.lineHeight = "1em";
        text.style.textAlign = "center";

        let aDiv = document.createElement("div");
        aDiv.style.display = "inline";
        aDiv.style.textAlign = "center";
        aDiv.style.marginBottom = "5%";

        let winnerForm = document.createElement("form");
        winnerForm.style.marginBottom = "5%";
        winnerForm.style.textAlign = "center";
        winnerForm.style.width = "80%";
        winnerForm.style.display = "inline";

        let winnerLink = document.createElement("input");
        winnerLink.setAttribute("type", "text");
        winnerLink.setAttribute("value", elements.verificationURL);
        winnerLink.style.width = "50%";

        winnerForm.appendChild(winnerLink);

        let copyToClipBoardButton = document.createElement("button");
        copyToClipBoardButton.innerHTML = "&#128203;";
        copyToClipBoardButton.style.height = "2em";
        copyToClipBoardButton.style.backgroundColor = "#3897f0";
        copyToClipBoardButton.style.border = "none";
        copyToClipBoardButton.style.borderRadius = "5px";
        copyToClipBoardButton.style.display = "inline";
        copyToClipBoardButton.style.marginLeft = "2%";
        copyToClipBoardButton.style.color = "white";
        copyToClipBoardButton.addEventListener("click", function () {
            const el = document.createElement('textarea');
            el.value = elements.verificationURL;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        });


        modalContent.appendChild(title);
        modalContent.appendChild(text);
        aDiv.appendChild(winnerForm);
        aDiv.appendChild(copyToClipBoardButton);
        modalContent.appendChild(aDiv);

        let lastHeader = document.getElementsByTagName("article");
        lastHeader = lastHeader[lastHeader.length-1];
        insertAfter(modal, lastHeader);
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

                    if (getStateName() === "load-waiter") {
                        let welcomeModal = document.getElementById("welcome-modal");
                        if (welcomeModal) {
                            welcomeModal.style.display = "block";
                        }
                    }

                    if (getStateName() === "finished") {
                        let finishModal = document.getElementById("finish-modal");
                        if (finishModal) {
                            finishModal.style.display = "block";
                        }
                    }

                    chrome.runtime.sendMessage({
                        command: "state-response",
                        state: getStateName(),
                        user: comment.user,
                        comment: comment.comment,
                        counter: elements.popupRequests,
                        url: elements.verificationURL,
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
            displayWelcomeModal();
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

                    hideDOMElement("welcome-modal");
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

        let requestSeed = () => {
            function seedHandler(message) {
                if (message.command === "seed-json") {
                    elements.seed = message.data.pulse.outputValue;
                    drawJSON.pulse_url = message.data.pulse.uri;

                    debugLog("seed is", elements.seed);
                    elements.chacha = new ChaChaRand(elements.seed);

                    removeListener();
                    handler.change(new CommentsLoader(handler));

                }
            }

            function removeListener() {
                chrome.runtime.onMessage.removeListener(seedHandler);
            }

            try {
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
                    console.log("comments count is", commentsCount);
                    chrome.runtime.sendMessage({
                        command: "comments-count",
                        commentsCount: commentsCount
                    })
                } catch(err) {
                    console.log(err);
                    debugLog("loaded comments...");
                    hideCommentsLoadingIcon();
                    clearInterval(intervalClickerId);
                    saveComments();
                }
            }

            intervalClickerId = window.setInterval(clicker, 800);
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
                    debugLog("chacha returned", elements.currentCommentID);
                    elements.popupRequests++;

                    debugLog("sending comment...");
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
            displayFinishModal();
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