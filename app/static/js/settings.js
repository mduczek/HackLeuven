function settings_main() {
    log("Settings, alrighty!");
    $("#settings-accordion").accordion();
    getFriends();
};

function getFriends() {
    log("getFriends");
    var id = FB.getUserID();
    log(id);

    FB.api("/" + id + "/friends", "GET", function (response) {
        log(response);
    });

}
