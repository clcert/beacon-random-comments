(function() {
    if (window.hasRun) {
        return;
    }
    window.hasRun = true;


    let elements = {
        beaconURL:  "https://beacon.clcert.cl/beacon/2.0/pulse/last",
        seed: null,
        totalComments: 0,
        currentCommentID: -1,
        popupRequests: 0
    };


    /**
     *
     */
    let randomBeacon = function() {
        this.requestSeed = () => {
            requestToURL(elements.beaconURL, jsonRequestCallback);
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

        let jsonRequestCallback = (err, data) => {
            if (err) {
                console.error(err);
            } else {
                elements.seed = JSON.parse(data).pulse.outputValue;
                Math.seedrandom(seed);
            }
        };
    };


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


    let LoadWaiter = function (handler) {
        this.handler = handler;
        this.init = () => {
            listenToLoad();
        };

        let listenToLoad = () => {
            function handleLoadRequest(message) {
                if (message.command === "load") {
                    removeLoadListener();
                    handler.change(new CommentsLoader(handler));
                }
            }

            function removeLoadListener() {
                browser.runtime.onMesage.removeListener(handleLoadRequest);
            }

            browser.runtime.onMessage.addListener(handleLoadRequest);
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
            return 0;
        };



    };

}) ();