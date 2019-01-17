

let elements = {
	welcomeDiv: document.getElementById("welcome"),
	main: document.getElementsByTagName("main")[0],
	startBtn: document.getElementById("btn-start"),
	retryBtn: document.getElementById("btn-retry"),
	finishBtn: document.getElementById("btn-finish"),
	shareBtn: document.getElementById("btn-share"),
	notReloadMsg: document.getElementById("not-reload-msg"),
	clipboardBtn: document.getElementById("btn-clipboard"),
	gifUrl: browser.extension.getURL("assets/gif/loading.gif")
};

let stateHandler = null;

function init() {
	$("#loading-choosing").hide();
	stateHandler = new StateHandler();
}


function fadeMessageRecursively() {
	if (elements.notReloadMsg.isToggleFading) {
		$("#not-reload-msg").fadeToggle(800, fadeMessageRecursively);
	}
}


function reportError(error) {
	console.error(error);
}

var StateHandler = function() {
	let currentState = new Welcome(this);
	currentState.init();

	this.change = function(state) {
		currentState = state;
		currentState.init();
	};
};


var Welcome = function(handler) {
	this.handler = handler;
	this.init = function() {
		if (!elements.startBtn.hasEventListener) {
			elements.startBtn.hasEventListener = true;
			elements.startBtn.addEventListener("click", this.sendLoadingMessage);	
		}
	};

	this.sendLoadingMessage = function(e) {
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


var LoadingComments = function(handler) {
	this.handler = handler;

	this.init = function() {
		$("#loading-check").hide();
		$("#choosing-row").hide();
		elements.notReloadMsg.isToggleFading = true;
		fadeMessageRecursively();
		this.listenForComments();	
	};

	this.listenForComments = function() {
		function handleLoaded(message) {
			$("#loading-spinner").hide();
			$("#loading-check").show();
			handler.change(new ChoosingComments(handler));
		}

		browser.runtime.onMessage.addListener(handleLoaded);
  	};
};


var ChoosingComments = function(handler) {
	this.handler = handler;
	this.init = () => {
		elements.notReloadMsg.isToggleFading = true;
		fadeMessageRecursively();
		$("#choosing-check").hide();
		$("#choosing-row").slideDown();
		this.createDelay();
	};

	this.createDelay = () => {
		window.setTimeout(() => {
			$("#choosing-spinner").hide();
			$("#choosing-check").show();
			window.setTimeout(this.sendChoosingMessage, 700);
		}, 3000);
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
	}
};


var Finish = function(handler) {
	this.handler = handler;
	this.init = function() {
		$("#menu").collapsible("open", 1);
		
		if (!elements.retryBtn.hasEventListener) {
			elements.retryBtn.hasEventListener = true;
			elements.retryBtn.addEventListener("click", function() {
				$("#menu").collapsible("open", 0);
				$("#choosing-spinner").show();
				handler.change(new ChoosingComments(handler));
			});
		}
		
		if (!elements.finishBtn.hasEventListener) {
			elements.finishBtn.hasEventListener = true;
			elements.finishBtn.addEventListener("click", function() {
				handler.change(new Share(handler));
			});
		}
		
	}
};

var Share = function(handler) {
	this.handler = handler;
	
	this.init = function() {
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
		
	}

}


init();	