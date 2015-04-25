function settings_main() {
    log("Settings, alrighty!");
    getFriends();

};
var ADD_TOOLTIP = "Add user to blacklist";
var REM_TOOLTIP = "Remove user from blacklist";
var TBLNAME = "Blacklist";

function getFriends() {
    log("getFriends");
    var id = FB.getUserID();
    log(id);

    FB.api("/" + id + "/friends?fields=id,name,picture.width(75).height(75)", "GET", function (response) {
        log(response);
        getBlacklistTbl(response.data);
    });
}

function showFriends(f, blacklisted) {
    for (i = 0; i < f.length; i++) {
        var div = $("<div/>", { class: "person" } );
        div.css("background-image", "url(" + f[i].picture.data.url + ")");
        var profile = $("<div/>", { class: "profile", id: f[i].id });
        profile.append(div);

        var p = $("<p/>", { class: "name" });
        p.text(f[i].name);
        profile.append(p);

        var x = $("<div/>", { class: "blacklist" });
        x.text("X");
        x.attr("title", ADD_TOOLTIP);
        profile.append(x);

        log("check if blacklisted?");
        if ($.inArray(f[i].id, blacklisted) !== -1) {
            profile.addClass("blacklisted");
            x.attr("title", REM_TOOLTIP);
        }

        $("#friends-list").append(profile);
    }

    $(".blacklist").click(blacklistClicked);
}

function blacklistFriend(f) {
    var id = f.parent().attr("id");
    var p = $("#" + id);
    p.addClass("blacklisted");
    f.attr("title", REM_TOOLTIP);
    log(id);
    updateBlacklistTbl();
}
function unblacklistFriend(f) {
    var id = f.parent().attr("id");
    var p = $("#" + id);
    p.removeClass("blacklisted");
    p.find(".overflow").remove();
    f.attr("title", ADD_TOOLTIP);
    log(id);
    updateBlacklistTbl();
}
function blacklistClicked() {
    if ($(this).parent().attr("class").indexOf("blacklisted") === -1) {
        log("blacklist");
        blacklistFriend($(this));
    } else {
        log("not blacklist");
        unblacklistFriend($(this));
    }
}
function updateBlacklistTbl() {
    var blacklisted = { blacklisted: [] };
    $(".blacklisted").each(function () {
        blacklisted.blacklisted.push($(this).attr("id"));
    });
    es_put_id(TBLNAME, FB.getUserID(), blacklisted, function (e) {});
}
function getBlacklistTbl(f) {
    es_get_id(TBLNAME, FB.getUserID(), function (e) {
        var d = JSON.parse(e)._source.blacklisted;
        log(d);
        showFriends(f, d);
    });
}
