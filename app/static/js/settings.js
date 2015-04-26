function settings_main() {
    log("Settings, alrighty!");
    getFriends(getBlacklistTbl);

};

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
        x.attr("title", blacklist_ADD_TOOLTIP);
        profile.append(x);

        log("check if blacklisted?");
        if ($.inArray(f[i].id, blacklisted) !== -1) {
            profile.addClass("blacklisted");
            x.attr("title", blacklist_REM_TOOLTIP);
        }

        $("#friends-list").append(profile);
    }

    $(".blacklist").click(blacklistClicked);
}

function blacklistFriend(f) {
    var id = f.parent().attr("id");
    var p = $("#" + id);
    p.addClass("blacklisted");
    f.attr("title", blacklist_REM_TOOLTIP);
    log(id);
    updateBlacklistTbl(blacklist_TBLNAME1, FB.getUserID(), id, true);
    updateBlacklistTbl(blacklist_TBLNAME2, id, FB.getUserID(), true);
}
function unblacklistFriend(f) {
    var id = f.parent().attr("id");
    var p = $("#" + id);
    p.removeClass("blacklisted");
    p.find(".overflow").remove();
    f.attr("title", blacklist_ADD_TOOLTIP);
    log(id);
    updateBlacklistTbl(blacklist_TBLNAME1, FB.getUserID(), id, false);
    updateBlacklistTbl(blacklist_TBLNAME2, id, FB.getUserID(), false);
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
function updateBlacklistTbl(TBLNAME, who, upd_id, add) {
    es_get_id(TBLNAME, who, function (e) {
        var data = [];
        if (JSON.parse(e).found !== false) {
            data = JSON.parse(e)._source.blacklisted;
        }
        if (add) {
            data.push(upd_id);
        } else if (data.indexOf(upd_id) != -1) {
            data.splice(data.indexOf(upd_id));
        }
        var d = { blacklisted: data };
        es_put_id(TBLNAME, who, d, function (e) {});
    });
}
function getBlacklistTbl(f) {
    es_get_id(blacklist_TBLNAME1, FB.getUserID(), function (e) {
        var d = [];
        if (JSON.parse(e).found !== false) {
            d = JSON.parse(e)._source.blacklisted;
            log(d);
        }
        showFriends(f, d);
    });
}
