calendar_main = function () {
    log("calendar_main");

    showDate();
    setInterval(function() { showDate(); }, 10*60*1000);

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
    var f = [];
    for (j = 0; j < friends.length; j++) {
        f.push(friends[j].id);
    }
    var id = FB.getUserID();
    es_get_id(blacklist_TBLNAME1, id, function (e) {
        var d = [];
        if (JSON.parse(e).found !== false) {
            d = JSON.parse(e)._source.blacklisted;
            log(d);
            for (i = 0; i < d.length; i++) {
                var index = f.indexOf(d[i]);
                if (index !== -1) {
                    f.splice(index);
                }
            }
        }
        $.ajax({
            type: "POST",
            url: "/events",
            data: JSON.stringify({ "user": id, "friends": f }),
            success: function(data) {
                log(data);
                calendar = JSON.parse(data);
                log(calendar);
                showCalendar(calendar);
            }

        });
    });
}

showDate = function () {
    var date = new Date();
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
        var res = {hour:undefined, minutes:undefined};
        var tmp = dateStr.split(" ")[1];
        tmp = tmp.split(":");
        res.hour = tmp[0];
        if (res.hour[0] === "0") res.hour = res.hour.substr(1);
        res.minutes = tmp[1];
        if (res.minutes[0] === "0") res.minutes = res.minutes.substr(1);
        return res
    };

    var getContainer = function(dt_start, dt_end) {
        var event_container = $("<div/>", { class: "event panel" });
        var start = $(".hour" + dt_start.hour);
        log(start);
        var t = start.position().top + ((dt_start.minutes/60) *  start.outerHeight());
        var end = $(".hour" + dt_end.hour);
        var e = (end.position().top +  + ((dt_end.minutes/60) *  end.outerHeight())) - t;
        event_container.css("top", t + "px");
        event_container.css("height", e + "px");
        return event_container;
    };

    for (i = 0; i < calendar.events.length; i++) {
         dt_start = getTime(calendar.events[i].dt_start);
         dt_end = getTime(calendar.events[i].dt_end);

         var event_container = getContainer(dt_start, dt_end);
         event_container.append($("<div/>", { class: "panel-body" }).text(calendar.events[i].summary));
         $("#events").append(event_container);
    }

    for (i = 0; i < calendar.breaks.length; i++ ) {
        var brk = calendar.breaks[i];
        dt_start = getTime(brk.dt_start);
        dt_end = getTime(brk.dt_end);

        var event_container = getContainer(dt_start, dt_end);
        event_container.append($("<div/>", { class: "panel-body" }).text("Break with: " + brk.user));
        $("#events").append(event_container);
    }

}
