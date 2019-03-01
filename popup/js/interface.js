
/**
 *
 * @type {{startBtn: HTMLElement, clipboardBtn: HTMLElement, collapsibleHeaders: HTMLCollectionOf<Element>,
 * main: Element, welcomeDiv: HTMLElement, notReloadMsg: HTMLElement, gifUrl: *, finishBtn: HTMLElement,
 * shareBtn: HTMLElement, retryBtn: HTMLElement, finishUser: HTMLElement, shareUser: HTMLElement, attempts: HTMLElement}}
 */
let elements = {
    debugging: false,
    collapsibleHeaders: document.getElementsByClassName("collapsible-header"),
    welcomeDiv: document.getElementById("welcome"),
    main: document.getElementsByTagName("main")[0],
    startBtn: document.getElementById("btn-start"),
    retryBtn: document.getElementById("btn-retry"),
    finishBtn: document.getElementById("btn-finish"),
    shareBtn: document.getElementById("btn-share"),
    clipboardBtn: document.getElementById("btn-clipboard"),
    notReloadMsg: document.getElementById("not-reload-msg"),
    attempts: document.getElementById("attempts-number"),
    finishUser: document.getElementById("finish-user"),
    shareUser: document.getElementById("share-user"),
    gifURL: chrome.extension.getURL("assets/gif/loading.gif")
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


function insertCSS(str) {
    let css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML = str;
    document.body.append(css);
    debugLog("Inserted css");
}

/**
 *
 */
function init() {
    $("#loading-choosing").hide();

    for (let i = 0; i < elements.collapsibleHeaders.length; i++) {
        elements.collapsibleHeaders[i].style.pointerEvents = 'none';
    }

    let stateHandler = new StateHandler();
    stateHandler.init();
}


/**
 *
 */
function fadeMessageRecursively() {
    if (elements.notReloadMsg.isToggleFading) {
        $("#not-reload-msg").fadeToggle(800, fadeMessageRecursively);
    }
}


/**
 *
 * @param error
 */
function reportError(error) {
    console.error(error);
}


/**
 *
 * @constructor
 */
let StateHandler = function() {
    let currentState;

    this.init = () => {
        let urlsInfo = [
            {   name: "Instagram",
                regex: /^(https:\/\/www.instagram.com\/p\/)[A-Za-z0-9_]+\/$/i,
                script: "/content_scripts/instagram.js",
                headerBg: chrome.extension.getURL("/popup/assets/images/instagram/background-header.jpg"),
                footerBg: chrome.extension.getURL("/popup/assets/images/instagram/background-footer.jpg")
            }
        ];


        let self = this;
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                let currentURL = tabs[0].url;
                let currentSiteInfo = null;
                for (let i = 0; i < urlsInfo.length; i++    ) {
                    if (urlsInfo[i].regex.test(currentURL)) {
                        currentSiteInfo = urlsInfo[i];
                        break;
                    }
                }

                if (currentSiteInfo) {
                    debugLog("valid url");
                    /*
                        Every time the popup is opened it executes the corresponding content script. If the content script has been
                        loaded before it will not be loaded again (because window.hasRun guard at the beginning of the content script).
                    */
                    debugLog("executing script...");
                    chrome.tabs.executeScript({file: "/content_scripts/seedrandom.min.js"});


                    // Executes current site script
                    chrome.tabs.executeScript({file: currentSiteInfo.script}, () => {
                        try {
                            requestState(self);
                        } catch (e) {
                            reportError(e);
                        }
                    });

                    document.getElementsByTagName("header")[0].style.backgroundImage = "url(" + currentSiteInfo.headerBg + ")";
                    document.getElementsByTagName("footer")[0].style.backgroundImage = "url(" + currentSiteInfo.footerBg + ")";
                } else {
                    debugLog("invalid url");
                    console.log(document.getElementsByTagName("header")[0]);
                    try {
                        $(document).ready(function() {
                            $("#error-modal").modal({dismissible: false});
                            $("#error-modal").modal("open");
                        });
                    } catch (e) {
                        console.error(e);
                    }

                }
            });


    };

    this.change = (state) => {
        currentState = state;
        currentState.init();
    };


    let requestState = (handler) => {
        function sendStateRequest(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                command: "state",
                url: tabs[0].url
            });
            listenForState(handler);
        }

        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            try {
                sendStateRequest(tabs);
            } catch (e) {
                reportError(e);
            }
        });
    };

    let listenForState = (handler) => {
        function stateHandler(message) {
            if (message.command === "state-response") {
                debugLog("received state response:", message.state);
                // Once received the state we remove the state listener
                removeStateHandler();

                if (message.state !== "load-waiter") {
                    // Hide welcome div
                    $("#welcome").hide();
                    $("#loading-choosing").show();


                    // Change chosen user at Finish and Share views
                    elements.finishUser.innerHTML = message.user;
                    elements.shareUser.innerHTML = message.user;

                    // Change attempts counter at Finish view
                    elements.attempts.innerHTML = message.counter.toString();
                }

                if (message.state === "seed-requester" || message.state === "comments-loader") {
                    $("#loading-check").hide();
                    $("#choosing-row").hide();
                }

                if (message.state === "get-comment-waiter" || message.state === "display-comment") {
                    $("#loading-spinner").hide();
                }

                switch (message.state) {
                    case "load-waiter":
                        currentState = new Welcome(handler);
                        break;
                    case "seed-requester":
                        currentState = new LoadingComments(handler);
                        break;
                    case "comments-loader":
                        currentState = new LoadingComments(handler);
                        break;
                    case "get-comment-waiter":

                        if (message.counter) {
                            $("#choosing-spinner").hide();
                            currentState = new Finish(handler);
                        } else {
                            currentState = new RequestingComment(handler);
                        }

                        break;
                    case "display-comment":
                        $("#choosing-spinner").hide();

                        currentState = new Finish(handler);

                        let sendDisplayMessage = () => {
                            function displayComment(tabs) {
                                chrome.tabs.sendMessage(tabs[0].id, {
                                    command: "display"
                                });

                                elements.notReloadMsg.isToggleFading = false;
                                handler.change(new Finish(handler));
                            }

                            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                                try {
                                    displayComment(tabs);
                                } catch (e) {
                                    reportError(e);
                                }
                            });
                        };
                        sendDisplayMessage();
                        break;

                    case "finished":
                        currentState = new Share(handler);
                }

                currentState.init();
            }
        }

        function removeStateHandler() {
            chrome.runtime.onMessage.removeListener(stateHandler);
        }

        debugLog("listening for state...");
        chrome.runtime.onMessage.addListener(stateHandler);
    };

};


/**
 *
 * @param handler
 * @constructor
 */
let Welcome = function(handler) {
    this.handler = handler;
    this.init = () => {

        try {
            if (!elements.startBtn.hasEventListener) {
                debugLog("adding start btn event listener");
                elements.startBtn.hasEventListener = true;
                elements.startBtn.addEventListener("click", this.sendLoadingMessage);
            }
        } catch (e) {
            reportError(e);
        }


    };

    this.sendLoadingMessage = (e) => {
        function loadComments(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                command: "load",
                loadingURL: elements.gifURL,
                url: tabs[0].url
            }, () => {handler.change(new LoadingComments(handler))});
        }

        $("#welcome").hide();
        $("#loading-choosing").show();

        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            try {
                loadComments(tabs);
            } catch (e) {
                reportError(e);
            }
        })
    };

};


/**
 *
 * @param handler
 * @constructor
 */
let LoadingComments = function(handler) {
    this.handler = handler;

    this.init = () => {
        $("#loading-check").hide();
        $("#choosing-row").hide();
        elements.notReloadMsg.isToggleFading = true;
        fadeMessageRecursively();
        this.listenForComments();
    };

    this.listenForComments = () => {
        function handleLoaded(message) {
            if (message.command === "loaded") {
                $("#loading-spinner").hide();
                $("#loading-check").show();

                handler.change(new RequestingComment(handler));
                removeLoadedListener();
            }

           // TODO
            if (message.command === "failed") {
                console.log("puta la wea fallo...");
            }
        }

        function removeLoadedListener() {
            chrome.runtime.onMessage.removeListener(handleLoaded);
        }

        chrome.runtime.onMessage.addListener(handleLoaded);
    };
};


/**
 *
 * @param handler
 * @constructor
 */
let RequestingComment = function(handler) {
    this.handler = handler;
    this.init = () => {
        $("#choosing-check").hide();
        $("#choosing-spinner").show();
        $("#choosing-row").slideDown();
        requestComment();
    };

    let requestComment = () => {
        function getComment(tabs) {
            debugLog("requesting comment...");
            chrome.tabs.sendMessage(tabs[0].id, {
                command: "get"
            });

            handler.change(new ChoosingComment(handler));
        }

        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            try {
                getComment(tabs);
            } catch (e) {
                reportError(e);
            }
        });
    };


};


/**
 *
 * @param handler
 * @constructor
 */
let ChoosingComment = function(handler) {
    this.handler = handler;

    this.init = () => {
        listenForChosenResponse();
    };

    let listenForChosenResponse = () => {
        function handleChosenResponse(message) {
            if (message.command === "chosen") {
                window.setTimeout(() => {
                    removeHandler();

                    // Change chosen user at Finish and Share views
                    elements.finishUser.innerHTML = message.user;
                    elements.shareUser.innerHTML = message.user;

                    // Change attempts counter at Finish view
                    elements.attempts.innerHTML = message.counter.toString();

                    $("#choosing-spinner").hide();
                    $("#choosing-check").show();

                    window.setTimeout(sendDisplayMessage, 700);
                }, 1500);
            }
        }

        function removeHandler() {
            chrome.runtime.onMessage.removeListener(handleChosenResponse);
        }

        chrome.runtime.onMessage.addListener(handleChosenResponse);
    };

    let sendDisplayMessage = () => {
        function displayComment(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                command: "display"
            });

            elements.notReloadMsg.isToggleFading = false;
            handler.change(new Finish(handler));
        }

        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            try {
                displayComment(tabs);
            } catch (e) {
                reportError(e);
            }
        });
    };
};


/**
 *
 * @param handler
 * @constructor
 */
let Finish = function(handler) {
    this.handler = handler;
    this.init = () => {
        $("#menu").collapsible("open", 1);

        if (!elements.retryBtn.hasEventListener) {
            elements.retryBtn.hasEventListener = true;
            elements.retryBtn.addEventListener("click", function() {
                $("#menu").collapsible("open", 0);
                $("#choosing-spinner").show();
                handler.change(new RequestingComment(handler));
            });
        }

        if (!elements.finishBtn.hasEventListener) {
            elements.finishBtn.hasEventListener = true;
            elements.finishBtn.addEventListener("click", function() {
                handler.change(new Share(handler));
                sendFinishMessage();
            });
        }

    };

    let sendFinishMessage = () => {
        function requestFinish(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                command: "finish"
            });
        }

        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            try {
                requestFinish(tabs);
            } catch (e) {
                reportError(e);
            }
        });
    };
};


/**
 *
 * @param handler
 * @constructor
 */
let Share = function(handler) {
    this.handler = handler;

    this.init = () => {
        $("#menu").collapsible("open", 2);
        $("main").animate({scrollTop: elements.main.clientHeight}, 800);

        if (!elements.clipboardBtn.hasEventListener) {
            elements.clipboardBtn.hasEventListener = true;
            elements.clipboardBtn.addEventListener("click", function() {
                M.toast({html: "Link copiado al portapapeles" , classes: "rounded"});
                const el = document.createElement('textarea');
                el.value = "random.uchile.cl";
                document.body.appendChild(el);
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
            });
        }
    };

};


init();	