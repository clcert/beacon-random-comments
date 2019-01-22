
/**
 *
 * @type {{startBtn: HTMLElement, clipboardBtn: HTMLElement, collapsibleHeaders: HTMLCollectionOf<Element>,
 * main: Element, welcomeDiv: HTMLElement, notReloadMsg: HTMLElement, gifUrl: *, finishBtn: HTMLElement,
 * shareBtn: HTMLElement, retryBtn: HTMLElement, finishUser: HTMLElement, shareUser: HTMLElement, attempts: HTMLElement}}
 */
let elements = {
	collapsibleHeaders: document.getElementsByClassName("collapsible-header"),
	welcomeDiv: document.getElementById("welcome"),
	main: document.getElementsByTagName("main")[0],
	startBtn: document.getElementById("btn-start"),
	retryBtn: document.getElementById("btn-retry"),
	finishBtn: document.getElementById("btn-finish"),
	shareBtn: document.getElementById("btn-share"),
	clipboardBtn: document.getElementById("btn-clipboard"),
	notReloadMsg: document.getElementById("not-reload-msg"),
	attempts: document.getElementById("attempts"),
	finishUser: document.getElementById("finish-user"),
	shareUser: document.getElementById("share-user"),
	gifUrl: browser.extension.getURL("assets/gif/loading.gif")
};


/**
 *
 * @type {null}
 */
let stateHandler = null;


/**
 *
 */
function init() {
	$("#loading-choosing").hide();

	for (let i = 0; i < elements.collapsibleHeaders.length; i++) {
	    elements.collapsibleHeaders[i].style.pointerEvents = 'none';
	}

	stateHandler = new StateHandler();
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
	let currentState = new Welcome(this);
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
let Welcome = function(handler) {
	this.handler = handler;
	this.init = () => {
		if (!elements.startBtn.hasEventListener) {
			elements.startBtn.hasEventListener = true;
			elements.startBtn.addEventListener("click", this.sendLoadingMessage);	
		}
	};

	this.sendLoadingMessage = (e) => {
		function loadComments(tabs) {
			browser.tabs.sendMessage(tabs[0].id, {
				command: "load",
				loadingUrl: elements.gifUrl,
				url: tabs[0].url
			}).then(handler.change(new LoadingComments(handler)));
		}

		$("#welcome").hide();
		$("#loading-choosing").show();

		browser.tabs.query({active: true, currentWindow: true})
			.then(loadComments)
			.catch(reportError);
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
				handler.change(new UserWaiting(handler));
				removeLoadedListener();
			}

			// TODO
			// if (message.command === "failed") {

			// }
		}

		function removeLoadedListener(message) {
			browser.runtime.onMessage.removeListener(handleLoaded);
		}

		browser.runtime.onMessage.addListener(handleLoaded);
  	};
};


/**
 *
 * @param handler
 * @constructor
 */
let UserWaiting = function(handler) {
	this.handler = handler;

	this.init = () => {
		this.sendUserMessage();
		this.listenForUser();
	};

	this.sendUserMessage = () => {
		function requestUser(tabs) {
			browser.tabs.sendMessage(tabs[0].id, {
				command: "user"
			});
		}

		browser.tabs.query({active: true, currentWindow: true})
			.then(requestUser);
	};

	this.listenForUser = () => {
		function handleUser(message) {
			if (message.command === "user-response") {
				elements.notReloadMsg.isToggleFading = true;
				fadeMessageRecursively();
				$("#choosing-check").hide();
				$("#choosing-row").slideDown();
				window.setTimeout(function() {
					elements.finishUser.innerHTML = message.user;
					elements.shareUser.innerHTML = message.user;
					elements.attempts.innerHTML = "Número de Intentos: " + message.counter.toString();
					handler.change(new ChoosingComments(handler));
					removeUserListener();
				}, 1000);
			}
		}

		function removeUserListener(message) {
			browser.runtime.onMessage.removeListener(handleUser);
		}

		browser.runtime.onMessage.addListener(handleUser);
	};
};


/**
 *
 * @param handler
 * @constructor
 */
let ChoosingComments = function(handler) {
	this.handler = handler;
	this.init = () => {
		this.createDelay();
	};

	this.createDelay = () => {
		window.setTimeout(() => {
			$("#choosing-spinner").hide();
			$("#choosing-check").show();
			window.setTimeout(this.sendChoosingMessage, 700);
		}, 2000);
	};

	this.sendChoosingMessage = () => {
		function chooseComment(tabs) {
			browser.tabs.sendMessage(tabs[0].id, {
				command: "choose"
			});

			elements.notReloadMsg.isToggleFading = false;
			handler.change(new Finish(handler));
		}

		browser.tabs.query({active: true, currentWindow: true})
			.then(chooseComment);
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
				handler.change(new UserWaiting(handler));
			});
		}
		
		if (!elements.finishBtn.hasEventListener) {
			elements.finishBtn.hasEventListener = true;
			elements.finishBtn.addEventListener("click", function() {
				handler.change(new Share(handler));
			});
		}
		
	};
};


let Share = function(handler) {
	this.handler = handler;
	
	this.init = () => {
		$("#menu").collapsible("open", 2);
		$("main").animate({scrollTop: elements.main.clientHeight}, 800);

		if (!elements.clipboardBtn.hasEventListener) {
			elements.clipboardBtn.hasEventListener = true;
			console.log(elements.clipboardBtn);
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