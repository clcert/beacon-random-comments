import {} from "../content_scripts/"


const urlStates = {
	SUCCESS: {
		CODE: 0,
		LANG: {
			ESP: "Instagram Random Comments: Haga click para sortear un comentario."
		}
	}

	DOMAIN: {
		CODE: 1,
		LANG: {
			ESP: "Dominio equivocado. Debes estar en Instagram para poder utilizar esta extensión."
		}
	},
	POST: {
		CODE: 2,
		LANG: {
			ESP: "Debes estar en un post de Instagram para poder utilizar esta extensión."
		}
	},
	NOT_FOUND: {
		CODE: 3,
		LANG: {
			ESP: "Post no encontrado. Por favor utilizar en un post válido."
		}
	}
};

function getUrlState() {
	// TODO: Obtener el lenguaje desde el navegador
	const lang = "ESP";

	const url = window.location.href;
	if (!url.startsWith("https://www.instagram.com"))
		return urlStates.DOMAIN;

	if (!url.startsWith("https://www.instagram.com/p/"))
		return urlStates.POST;

	let http = new XMLHttpRequest();
	http.open('HEAD', url, false);
	http.send();

	if (http.status === 404)
		return urlStates.NOT_FOUND;

	return urlStates.SUCCESS;
}


function disableRandomButton() {
	document.getElementById("chooser").disable = true;
}

function listenForClicks() {
	document.addEventListener("click", (e) => {

		function chooseComent() {
			
		}

		function reportError(error) {
			console.error.("Se tuvo el siguiente error: ${error}");
		}

		if (e.target.classList.contains("choose")) {
			browser.tabs.query({active: true, currentWindow: true})
				.then(chooseComment)
				.catch(reportError);
		}
	});
}

var extensionLoader = (() => {
	console.log(getUrlState());
})();

