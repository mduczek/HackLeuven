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
        event.preventDefault();
        var form = document.getElementById("upload_ics");
        var form_data = new FormData(form);

        var fileInput = document.getElementById('file_name');
        var file = fileInput.files[0];
        form_data.append('file', file);

        var xhr = new XMLHttpRequest();
        // Add any event handlers here...
        xhr.open('POST', "/upload_ics", true);
        xhr.onreadystatechange = function() {
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
          + date.getMonth()
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

    for (i = 0; i < 24; i++) {
        $("#events").append($("<div/>", {class: "hour" + i + " hour row"}).append($("<div/>", {class: "time col-xs-3"}).text(i + ":00")));
    }
    setCurrent();
    setInterval(function() {
        setCurrent();
    }, 60*1000);

    var dt_start = {}, dt_end = {};
    for (i = 0; i < calendar.events.length; i++) {
         var tmp = calendar.events[i].dt_start.split(" ")[1];
         tmp = tmp.split(":");
         dt_start.hour = tmp[0];
         if (dt_start.hour[0] === "0") dt_start.hour = dt_start.hour.substr(1);
         dt_start.minutes = tmp[1];
         if (dt_start.minutes[0] === "0") dt_start.minutes = dt_start.minutes.substr(1);

         tmp = calendar.events[i].dt_end.split(" ")[1];
         tmp = tmp.split(":");
         dt_end.hour = tmp[0];
         if (dt_end.hour[0] === "0") dt_end.hour = dt_end.hour.substr(1);
         dt_end.minutes = tmp[1];
         if (dt_end.minutes[0] === "0") dt_end.minutes = dt_end.minutes.substr(1);

         var event_container = $("<div/>", { class: "event panel" });
         var start = $(".hour" + dt_start.hour);
         log(start);
         var t = start.position().top + ((dt_start.minutes/60) *  start.outerHeight());
         var end = $(".hour" + dt_end.hour);
         var e = (end.position().top +  + ((dt_end.minutes/60) *  end.outerHeight())) - t;
         event_container.css("top", t + "px");
         event_container.css("height", e + "px");
         event_container.append($("<div/>", { class: "panel-body" }).text(calendar.events[i].summary));
         $("#events").append(event_container);
    }

}
