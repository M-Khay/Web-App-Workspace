(function() {

WG = window.WG || {};

var Default = {
    VOTE_MARK_URL: "/static/whatsgoodly/img/tabbar-paw-dark.png",
    OPTION_CLASS: "bg-purple",
    FOOTER_CLASS: "bg-purple text-white",
    POLL_BANNER_CLASS: "feed-banner",
    BODY_CLASS: "",
    ANIMATE_ON_LOAD: true
};

var Minimal = $.extend({}, Default, {
    VOTE_MARK_URL: "/static/whatsgoodly/img/vote_check.png",
    OPTION_CLASS: "bg-purple-blue",
    FOOTER_CLASS: "bg-white text-muted sm",
    POLL_BANNER_CLASS: "hidden",
    BODY_CLASS: "minimal",
    ANIMATE_ON_LOAD: false
});

var MinimalSchool = $.extend({}, Minimal, {
    POLL_BANNER_CLASS: "feed-banner no-icon"
});

WG.themes = {
    // Mapping of theme names to the indexes they correspond to 
    // in the themable parts below

    choices: {
        DEFAULT: Default,
        MINIMAL: Minimal,
        MINIMAL_SCHOOL: MinimalSchool
    },

    choiceFromURL: function() {
        var hash = WG.utils.parseQueryString()["theme"] || "default";
        var choice = hash.toUpperCase();
        if (!(choice in this.choices)) {
            console.warn("Invalid theme choice in hash: " + hash);
            return this.choices.DEFAULT;
        }
        return this.choices[choice];
    }
};

})();