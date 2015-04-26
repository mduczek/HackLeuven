
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
var fb_APP_NAMESPACE = 'calendar-gap';
var fb_PERMISSIONS = {};
var fb_DEFAULT_PERMISSIONS = "user_friends";

var blacklist_ADD_TOOLTIP = "Add user to blacklist";
var blacklist_REM_TOOLTIP = "Remove user from blacklist";
var blacklist_TBLNAME1 = "Blacklist_cant_see_me";
var blacklist_TBLNAME2 = "Blacklist_cant_see_them";
