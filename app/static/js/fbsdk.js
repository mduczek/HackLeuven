function FBinit(app_id) {
    log("inicjacja FB SDK");
    FB.init({
        appId: app_id,
        frictionlessRequests: true,
        status: true,
        version: 'v2.1'
    });
}

function FBloginRequired() {
    // obsluga niezbednych eventow
    log("FBloginRequired");
    FB.Event.subscribe('auth.authResponseChange', onAuthResponseChange);
    FB.Event.subscribe('auth.statusChange', onStatusChange);

    if (!FB.getUserID())
        login(loginCallback);
}

// obsluga logowania
function login(callback) {
    console.log("login");
    FB.login(callback, { scope: fb_DEFAULT_PERMISSIONS });
}

// callback do logowania
function loginCallback(response) {
    if (response.status != 'connected') {
        exit();
    } else {
        FB.api("/me/permissions", "GET", function (response) {
            fb_PERMISSIONS = response.data;
            log(fb_PERMISSIONS);
        });
    }
}

// zmienia sie status (aplikacja zostala zaakceptowana przez Usera)
function onStatusChange(response) {
    log("onStatusChange");
    if (response.status != 'connected') {
        login(loginCallback);
    } else {
        //reRequestPermissions(DEFAULT_PERMISSIONS, undefined, exit);
        main();
    }
}

function reRequestPermissions(permissions, onSuccess, onFailure) {
    // tu pytamy o dodatkowe uprawnienia, ktorych moze nam brakowac...
    if (!hasPermission(permissions)) {
        log("not ok?");
        if (!fb_PERMISSIONS[permissions]) {
            fb_PERMISSIONS[permissions] = true;
            reRequest(permissions, function (x) { 
                if (hasPermission(permissions)) {
                    log('xxx');
                    if (onSuccess !== undefined)
                        onSuccess();
                } else {
                    log('yyy');
                    if (onFailure !== undefined)
                        onFailure();
                }
            });
        } else {
            // pytany, ale nie dal dostepu, wiec wolamy onFailure
            onFailure();
        }

    } else {
        onSuccess();
    }

}

function hasPermission(permissions) {
    log("szukam uprawnien: " + permissions);
    for (var p in fb_PERMISSIONS) {
        if (fb_PERMISSIONS[p].permission == permissions
                && fb_PERMISSIONS[p].status == 'granted') {
                    log("OK");
                    return true;
                }
    }
    return false;
}

// przyszla odpowiedz od uzytkownika
function onAuthResponseChange(response) {
    log('onAuthResponseChange', response);
    loginCallback(response);
}

function getFriends(callback) {
    log("getFriends");
    var id = FB.getUserID();
    log(id);

    FB.api("/" + id + "/friends?fields=id,name,picture.width(75).height(75)", "GET", function (response) {
        log(response);
        callback(response.data);
    });
}

