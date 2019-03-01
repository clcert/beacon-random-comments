
i18next
    .use(i18nextBrowserLanguageDetector)
    .init({
    debug: true,
    resources: {
        en: {
            translation: {
                // Tabs titles translations
                "choose-tab-title": "Choose a comment!",
                "finish-tab-title": "Finish Draw",
                "share-tab-title": "Share it!",

                // Welcome div translations
                "welcome-title": "Welcome!",
                "welcome-paragraph": "Follow the instructions to start your draw!",
                "btn-start": "Start Draw",

                // Loading Choosing div translations
                "loading-span": "Loading Comments",
                "choosing-span": "Choosing Comment",
                "not-reload-msg": "Please do not reload the window.",

                // Finish div translations
                "attempts-text": "Tries: ",
                "finish-chosen-user": "You have chosen to:",
                "btn-retry": "Retry",
                "btn-finish": "Finish",

                // Sharing div translations
                "sharing-draw-info": "Draw Information",
                "sharing-draw-winner-intro": "The winner is!",

                // Instructions translations
                "choose-instructions": "Click \"Start Draw\" to randomly choose a comment",
                "finish-instructions": "Click \"Finish\" to finish the draw or \"Retry\" to choose a new comment.",
                "share-instructions": "Use this <a>link</a> to ensure to your followers the draw was <b>random</b>, <b>transparent</b> y <b>verifiable</b>.\n" +
                    "<span>You can share it with </span><i class=\"material-icons tiny\">share</i> <span> or copy to the clipboard </span><i class=\"material-icons tiny\">content_copy</i>",

                // Share modal translations
                "share-title": "Share",

                // Error modal translations
                "error-title": "Oops, an error has occurred",
                "error-paragraph": "Please verify you are inside an Instagram post to be able to use the extension"
            }
        },
        es: {
            translation: {
                // Tabs titles translations
                "choose-tab-title": "Escoge un comentario",
                "finish-tab-title": "Finalizar Sorteo",
                "share-tab-title": "Compártelo!",

                // Welcome div translations
                "welcome-title": "Bienvenido!",
                "welcome-paragraph": "Sigue las instrucciones para iniciar tu sorteo!",
                "btn-start": "Iniciar Sorteo",

                // Loading Choosing div translations
                "loading-span": "Cargando Comentarios",
                "choosing-span": "Escogiendo Comentario",
                "not-reload-msg": "Por favor no recargues la ventana.",

                // Finish div translations
                "finish-chosen-user": "Has escogido a:",
                "attempts-text": "Número de Intentos: ",
                "btn-retry": "Reintentar",
                "btn-finish" : "Terminar",

                // Sharing div translations
                "sharing-draw-info": "Información del Sorteo",
                "sharing-draw-winner-intro": "El ganador es!",

                // Instructions translations
                "choose-instructions": "Haz click en \"Iniciar Sorteo\" para escoger un comentario aleatoriamente.",
                "finish-instructions": "Haz click en \"Terminar\" para finalizar el sorteo o \"Reintentar\" para elegir un nuevo comentario.",
                "share-instructions": "Utiliza este <a>link</a> para asegurar a tus seguidores que el concurso fue <b>aleatorio</b>, <b>transparente</b> y <b>verificable</b>.\n" +
                    "<span>Puedes compartirlo con </span><i class=\"material-icons tiny\">share</i> <span> o copiarlo con </span><i class=\"material-icons tiny\">content_copy</i>",

                // Share modal translations
                "share-title": "Compartir",

                // Error modal translations
                "error-title": "Oops, ha ocurrido un error",
                "error-paragraph": "Por favor verifica que te encuentras en un post de Instagram para poder utilizar la extensión."
            }
        }
    }
}, function(err, t) {
        // Tabs titles translations
        document.getElementById("choose-tab-title").innerText = i18next.t("choose-tab-title");
        document.getElementById("finish-tab-title").innerText = i18next.t("finish-tab-title");
        document.getElementById("share-tab-title").innerText = i18next.t("share-tab-title");

        // Welcome div translations
        document.getElementById("welcome-title").innerText = i18next.t("welcome-title");
        document.getElementById("welcome-paragraph").innerText = i18next.t("welcome-paragraph");
        document.getElementById("btn-start").innerText = i18next.t("btn-start");

        // Loading Choosing div translations
        document.getElementById("loading-span").innerText = i18next.t("loading-span");
        document.getElementById("choosing-span").innerText = i18next.t("choosing-span");
        document.getElementById("not-reload-msg").innerText = i18next.t("not-reload-msg");

        // Finish div translations
        document.getElementById("finish-chosen-user").innerText = i18next.t("finish-chosen-user");
        document.getElementById("attempts-text").innerText = i18next.t("attempts-text");
        document.getElementById("btn-retry").innerText = i18next.t("btn-retry");
        document.getElementById("btn-finish").innerText = i18next.t("btn-finish");

        // Sharing div translations
        document.getElementById("sharing-draw-info").innerText = i18next.t("sharing-draw-info");
        document.getElementById("sharing-draw-winner-intro").innerText = i18next.t("sharing-draw-winner-intro");

        // Instructions translations
        document.getElementById("choose-instructions").innerText = i18next.t("choose-instructions");
        document.getElementById("finish-instructions").innerText = i18next.t("finish-instructions");
        document.getElementById("share-instructions").innerHTML = i18next.t("share-instructions");

        // Share modal translations
        document.getElementById("share-title").innerText = i18next.t("share-title");

        // Error modal translations
        document.getElementById("error-title").innerText = i18next.t("error-title");
        document.getElementById("error-paragraph").innerText = i18next.t("error-paragraph");
});