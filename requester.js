'use strict';

const beaconURL = "https://beacon.clcert.cl/beacon/2.0/pulse/last";
const serverURL = "http://ec2-18-219-248-89.us-east-2.compute.amazonaws.com/";

function reportError(err) {
    console.error(err);
}


function handleMessage(message) {
    switch (message.command) {
        case "send-winner":
            handleSendWinner(message);
            break;
        case "get-seed":
            handleGetSeed();
            break;
    }
}


function handleGetSeed() {
    function requestSeed(callback) {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", beaconURL, true);
        xhr.onload = function () {
           if (xhr.status === 200) {
               callback(null, xhr.response);
           } else {
               callback(xhr.status, null);
           }
        };
        xhr.send();
    }

    function seedCallback(err, data) {
        if (err) {
            reportError("response status code = ", err);
            return;
        }

        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id,
                {
                    command: "seed-json",
                    data: JSON.parse(data)
                });
        });
    }

    requestSeed(seedCallback);
}


function handleSendWinner(message) {
    function sendWinnerJSON(winnerJSON, callback) {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", serverURL, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onload = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                callback(null, xhr.responseText);
            } else {
                callback(status, null);
            }
        };
        xhr.send(JSON.stringify(winnerJSON));
    }

    function winnerJSONCallback(err, url) {
        if (err) {
            reportError("response status code = ", err);
            return;
        }

        function tabQuery(tabs) {
            try {
                chrome.tabs.sendMessage(tabs[0].id, {
                    command: "winner-url",
                    url: url
                });
            } catch(e) {
                reportError(e);
            }
        }

        chrome.tabs.query({active: true, currentWindow: true}, tabQuery);
    }

    sendWinnerJSON(message.winnerJSON, winnerJSONCallback);
}

// Create the listener of the background script
chrome.runtime.onInstalled.addListener(function(){
    chrome.contextMenus.create({
        "id": "requester",
        "title": "Requester Context Menu",
        "contexts": ["launcher"]
    });
});

// Create the listener to handle all messages
chrome.runtime.onMessage.addListener(handleMessage);