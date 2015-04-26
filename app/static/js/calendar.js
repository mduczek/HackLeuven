current_offset = -(new Date()).getHours();


clear_table_data = function() {
    $("#contact-details td.data").text("");
    $("#button-holder").html("");
    $("#map-holder").html("");
};

calendar_main = function () {
    log("calendar_main");

    showDate();
    setInterval(function() { showDate(); }, 10*60*1000);

    $('#prev_day').click(function(){
        current_offset -= 24;
        _getEvents();
        showDate();
    });

    $('#next_day').click(function(){
        current_offset += 24;
        _getEvents();
        showDate();
    });


    $("#add_calendar").click(function () {
        $("#upload_alert").hide().removeClass("alert-danger").removeClass('alert-succes').text("");
    });

    getFriends(getEvents);
    //tmp TODO REMOVE IT
    $("#user_id").val(FB.getUserID());

    $("#upload_ics").submit(function () {
        var form = document.getElementById("upload_ics");
        var form_data = new FormData(form);

        var fileInput = document.getElementById('file_name');
        var file = fileInput.files[0];
        form_data.append('file', file);

        var xhr = new XMLHttpRequest();
        // Add any event handlers here...
        xhr.onreadystatechange = function() {
            log(xhr.readyState);
            if (xhr.readyState == 4) {
                var div = $("#upload_alert");
                div.append('<button type="button" class="close" data-dismiss="alert">×</button>');
                if (xhr.status === 200) {
                    div.addClass("alert-success");
                    div.text("Great! Your calendar is ready!");
                    getFriends(getEvents);
                } else {
                    div.addClass("alert-danger");
                    div.text("Ooops. Something went wrong with uploading your calendar...");
                }
                $("#upload_ics")[0].reset();
                div.show();
                $(document).trigger("load-stop");
            }
        }
        xhr.open('POST', $(this).attr("action"), true);
        xhr.send(form_data);

        $(document).trigger("load-start");
        return false;
    });
}

getEvents = function (friends) {
    var calendar;
    global_f = [];
    for (var j = 0; j < friends.length; j++) {
        global_f.push(friends[j].id);
    }
    log(global_f);
    global_id = FB.getUserID();
    es_get_id(blacklist_TBLNAME2, global_id, function (e) {
        var d = [];
        if (JSON.parse(e).found !== false) {
            d = JSON.parse(e)._source.blacklisted;
            console.log(">>>" + d);
            dc = {}
            for (var i = 0; i < global_f.length; i++) {
                dc[global_f[i]] = 1;
            }
            console.log(dc);
            for (var i = 0; i < d.length; i++) {
                delete dc[d[i]];
            }
            global_f = [];
            console.log(dc);
            for (var k in dc) {
                global_f.push(k);
            }
        }
        _getEvents();
    });
};

_getEvents = function() {
    $.ajax({
        type: "POST",
        url: "/events",
        data: JSON.stringify({ "user": global_id, "friends": global_f,
            "range_back": -current_offset,
            "range_ahead": current_offset+24}),
        success: function(data) {
            log(data);
            calendar = JSON.parse(data);
            log(calendar);
            showCalendar(calendar);
        }

    });
};

showDate = function () {
    var date = new Date(Date.now() + current_offset*3600*1000);
    var d = ""
          + date.getFullYear()
          + "/"
          + (date.getMonth() + 1)
          + "/"
          + date.getDate()
          + " "
          + ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][date.getDay()]
          ;
    $("#calendar h3").text(d);

    $.get(weather_ENDPOINT + "weather?q=Warsaw&APPID=" + weather_API_KEY, function (data) {
        log(data);
        var img = $("<div/>", { class: "weather" });
        var pic = weather_ICON + data.weather[0].icon + ".png";
        img.css("background-image", "url(" + pic + ")");
        img.html((parseInt(data.main.temp) - 273.15).toFixed(1) + "&deg;C");
        $("#calendar h3").append(img);
    });
}

setCurrent = function () {
    log("setCurrent");
    var d = new Date();
    $(".current").removeClass("current");
    $(".current-line").remove();
    var current = $(".hour" + d.getHours());
    current.addClass("current");
    var line = $("<div/>", { class: "current-line" }).css("top", d.getMinutes() + "%");
    current.append(line);
}

showCalendar = function (calendar) {

    log(calendar);
    $("#events").empty();
    var i;

    for (i = 0; i < 24; i++) {
        $("#events").append($("<div/>", {class: "hour" + i + " hour row"}).append($("<div/>", {class: "time col-xs-3"}).text(i + ":00")));
    }
    setCurrent();
    setInterval(function() {
        setCurrent();
    }, 60*1000);

    var dt_start = {}, dt_end = {};

    var getTime = function(dateStr) {
        log(dateStr);
        var res = {hour:undefined, minutes:undefined};
        var tmp = dateStr.split(" ")[1];
        tmp = tmp.split(":");
        res.hour = tmp[0];
        if (res.hour[0] === "0") res.hour = res.hour.substr(1);
        res.minutes = tmp[1];
        if (res.minutes[0] === "0") res.minutes = res.minutes.substr(1);
        return res
    };

    var getContainer = function(dt_start, dt_end, brk) {
        var start = $(".hour" + dt_start.hour);
        log(start);
        var t = start.position().top + ((dt_start.minutes/60) *  start.outerHeight());
        var end = $(".hour" + dt_end.hour);
        var e = (end.position().top + ((dt_end.minutes/60) *  end.outerHeight())) - t;
        var event_container;
        event_container = $("<div/>", { class: "event panel" });
        if (e <= 0) {
            end = $(".hour23");
            e = end.position().top - t;
            event_container.css("margin-left", "100px");
        }


        event_container.css("top", t + "px");

        event_container.css("height", e + "px");
        if (brk) {
            var brkclass = "brk";

            var tmp = $("." + brkclass + "[id=brk" + dt_start.hour + "]") ;
            if (tmp.length > 0 && tmp[0] !== undefined) {
                event_container = tmp;
                log(tmp);
                tmp.remove();
            } else {
                event_container.addClass("panel-light").addClass(brkclass);
                log(dt_start.hour);
                event_container.attr("id", "brk" + dt_start.hour);
            }
        }

        return event_container;
    };

    var setUserElement = function(brk, container) {
        var user = brk.user;
        var index = USERS.ids.indexOf(user);
        if (index === -1) {
            //TODO email
            FB.api("/" + user + "?fields=email,first_name,last_name,picture.width(40).height(40)", "GET", function (e) {
                USERS.users.push(e);
                addUserElement(user, container, e, { dt_start: brk.dt_start, dt_end: brk.dt_end, location: brk.location });
            });
        } else {
            addUserElement(user, container, null, { dt_start: brk.dt_start, dt_end: brk.dt_end, location: brk.location });
        }
    };

    var showMap = function(location, container) {
        $.get("http://maps.googleapis.com/maps/api/geocode/json?address=" + encodeURIComponent(location), function (e) {
            log(e);
            var lat = e.results[0].geometry.location.lat;
            var lon = e.results[0].geometry.location.lng;
            var el = document.getElementById('map-holder');
            var el2 = $(el);
            el2.show();

            var myLatlng = new google.maps.LatLng(lat + 0.05, lon - 0.1);
            var options = {  
                zoom: 12,  
                center: myLatlng,       
                mapTypeId: google.maps.MapTypeId.ROADMAP  
            };
            var map = new google.maps.Map(el, options);  
            map.setCenter(myLatlng);
            google.maps.event.trigger(map, 'resize');

            var marker = new google.maps.Marker({
                position: new google.maps.LatLng(lat, lon),
                map: map,
                title: "Last known location..."
            });
        });
    }

    var addUserElement = function (user, container, data, brk) {
        if (data === null) {
            for (i = 0; i < USERS.users.length; i++) {
                if (USERS.users[i].id === user) {
                    data = USERS.users[i];
                }
            }
        }
        log(user);
        var div = $("<div/>", { class: "person width40" } );
        div.css("background-image", "url(" + data.picture.data.url + ")");
        var profile = $("<div/>", { class: "profile width40", id: data.id });
        profile.append(div);

        var p = $("<p/>", { class: "name" });
        p.text(data.first_name);
        profile.append(p);
        container.append(profile);
        profile.attr("data-toggle", "modal").attr("data-target", "#personal-details");
        profile.click(function() {
            clear_table_data();
            var table = $("#contact-details");
            table.find("#contact-name").text(data.first_name + " " + data.last_name);
            if (data.email !== undefined) {
                table.find("#contact-email").html("<a href=\"mailto:" + data.email + "\">" + data.email + "</a>");
            }
            table.find("#contact-free").text("Free from " + brk.dt_start + " to " + brk.dt_end);
            var btn = $("<btn/>", {class: "btn btn-info", id: "poke"}).text("Poke!");
            btn.click(function () {
                send_notification(data.id, "@[" + FB.getUserID() + "] Hi, wanna meet up between " + brk.dt_start + " and " + brk.dt_end + " ?");
                $(this).after($("<div/>").text("Poked!"));
                $(this).fadeOut(1000);
                $("#button-holder").html("");
            });
            $("#button-holder").append(btn);

            $(window).scrollTop(0);
            if (brk['location'] && brk['location'] !== "") {
                showMap(brk.location, table.parent());
            }

        });
    };

    for (i = 0; i < calendar.events.length; i++) {
         dt_start = getTime(calendar.events[i].dt_start);
         dt_end = getTime(calendar.events[i].dt_end);

         var event_container = getContainer(dt_start, dt_end, false);
         event_container.append($("<div/>", { class: "panel-body" }).text(calendar.events[i].summary));
         $("#events").append(event_container);
    }

    for (i = 0; i < calendar.breaks.length; i++ ) {
        for (j = 0; j < calendar.breaks[i].length; j++) {
            var brk = calendar.breaks[i][j];
            dt_start = getTime(brk.dt_start);
            dt_end = getTime(brk.dt_end);

            var event_container = getContainer(dt_start, dt_end, true);
            setUserElement(brk, event_container);
            $("#events").append(event_container);
        }
    }

}
