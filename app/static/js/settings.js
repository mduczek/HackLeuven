function settings_main() {
    log("Settings, alrighty!");
    $("#settings-accordion").accordion({
        heightStyle: "content"
    });
    getFriends();

    $(".blacklist").unbind("click", blacklistClicked).bind("click", blacklistClicked);

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
        showFriends(response.data);
    });
}

function showFriends(f) {
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

        $("#friends-list").append(profile);
    }
}

function blacklistFriend(f) {
    var id = f.parent().attr("id");
    var p = $("#" + id);
    p.addClass("blacklisted");
    p.append($("<div />", { class: "overflow" }));
    f.attr("title", REM_TOOLTIP);
    log(id);

    var blacklisted = { blacklisted: [] };
    $(".blacklisted").each(function () {
        blacklisted.blacklisted.push($(this).attr("id"));
    });
    es_put_id(TBLNAME, FB.getUserID(), blacklisted, function (e) {
        log(e);
    });
}
function unblacklistFriend(f) {
    var id = f.parent().attr("id");
    var p = $("#" + id);
    p.removeClass("blacklisted");
    p.find(".overflow").remove();
    f.attr("title", ADD_TOOLTIP);
    log(id);
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
