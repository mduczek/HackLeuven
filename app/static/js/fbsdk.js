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
    FB.login(callback, { scope: DEFAULT_PERMISSIONS });
}

// callback do logowania
function loginCallback(response) {
    log('loginCallback'); log(response);
    if (response.status != 'connected') {
        exit();
    } else {
        FB.api("/me/permissions", "GET", function (response) {
            PERMISSIONS = response.data;
            log(PERMISSIONS);
            main();
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
        if (!PERMISSIONS[permissions]) {
            PERMISSIONS[permissions] = true;
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
    for (var p in PERMISSIONS) {
        if (PERMISSIONS[p].permission == permissions
                && PERMISSIONS[p].status == 'granted') {
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
