var APP_ID = '359638564247355';
var APP_NAMESPACE = 'calendar-gap';

var PERMISSIONS = {};
var DEFAULT_PERMISSIONS = "user_friends";

var DEBUG = true;

var PAGES = [
    {
        addresses: ["/index", "/"]
        , login_required: false
    }
    , {
        addresses: ["/contact"]
        , login_required: false
    }
    , {
        addresses: ["/settings"]
        , login_required: true
        , main_function: settings_main
    }
    , {
        addresses: ["/calendar"]
        , login_required: true
        , main_function: calendar_main
    }
];

var CURRENT_PAGE = {};

$(document).ready(function () {

    var body = $("body");
    $(document).on("load-start", function () {
        body.addClass("loading").delay(100); 
    });
    $(document).on("load-stop", function () {
        body.delay(100).removeClass("loading"); 
    });

    // inicjacja SDK
    FBinit(APP_ID);

    var path = window.location.pathname;
    for (i = 0; i < PAGES.length; i++) {
        if ($.inArray(path, PAGES[i].addresses) !== -1) { // znalazlo odpowiednia strone!
            CURRENT_PAGE = PAGES[i];
            i = PAGES.length; // wyjscie
        }
    };

    if (CURRENT_PAGE.login_required === true) {
        FBloginRequired();
    }
});

function exit() {
    log("exit called");
    //top.location.href = 'https://www.facebook.com/appcenter/' + APP_NAMESPACE;
}

function reRequest(scope, callback) {
    FB.login(function (response) {
        // generalnie na nowo ustawiamy permsy
        FB.api("/me/permissions", "GET", function(r) {
            PERMISSIONS = r.data;
            callback(response);
        });

        }, { scope: scope, auth_type: 'rerequest' });
}

function main() {
    log("main");
    if (CURRENT_PAGE.main_function !== undefined) {
        CURRENT_PAGE.main_function();
    }

}
