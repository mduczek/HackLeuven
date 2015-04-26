var weather_API_KEY = "74cb2ea061793f3cacd22c20db3f59c0";
var weather_ENDPOINT = "http://api.openweathermap.org/data/2.5/";
var weather_ICON = "http://openweathermap.org/img/w/";

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

var DEBUG = true;

var fb_APP_ID = '359638564247355';
var fb_APP_SECRET = '15cc18c98ac398c0a428bb034d37ca43'; // naaasty thingieees
var fb_APP_NAMESPACE = 'calendar-gap';
var fb_PERMISSIONS = {};
var fb_DEFAULT_PERMISSIONS = "user_friends";

var blacklist_ADD_TOOLTIP = "Add user to blacklist";
var blacklist_REM_TOOLTIP = "Remove user from blacklist";
var blacklist_TBLNAME1 = "Blacklist_cant_see_me";
var blacklist_TBLNAME2 = "Blacklist_cant_see_them";

var USERS = {
    ids: []
    , users: []
};

$(document).ready(function () {

    var body = $("body");
    $(document).on("load-start", function () {
        body.addClass("loading").delay(100); 
    });
    $(document).on("load-stop", function () {
        body.delay(100).removeClass("loading"); 
    });

    // inicjacja SDK
    FBinit(fb_APP_ID);

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
            fb_PERMISSIONS = r.data;
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

function send_notification(uid, message) {
    var access_token = fb_APP_ID + "|" + fb_APP_SECRET;
    FB.api('/' + uid + '/notifications?access_token=' + access_token
        + '&href=/calendar&template=' + message, 'POST',
        function(response) { console.log(response); })
}
