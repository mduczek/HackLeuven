calendar_main = function () {
    log("calendar_main");

    showDate();
    setInterval(function() { showDate(); }, 60*1000);

    var calendar = $.parseJSON($("#calendar-value").text());

    $("#add_calendar").click(function () {
        $("#upload_alert").hide().removeClass("alert-danger").removeClass('alert-succes').text("");
    });

    //tmp TODO REMOVE IT
    calendar = { events: [{dt_start: "2015-04-25T11:00:00.000Z", dt_end: "2015-04-25T12:00:00.000Z", summary: "asdf", location: ""}], breaks: [{ dt_start: "2015-04-25T12:00:00.000Z", dt_end: "2015-04-25T16:00:00.000Z", users: ["1234", "123456"]}]};
    showCalendar(calendar);
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

    for (i = 0; i < 24; i++) {
        $("#events").append($("<div/>", {class: "hour" + i + " hour row"}).append($("<div/>", {class: "time col-xs-3"}).text(i + ":00")));
    }
    setCurrent();
    setInterval(function() {
        setCurrent();
    }, 60*1000);

    var dt_start = {}, dt_end = {};
    for (i = 0; i < calendar.events.length; i++) {
         var tmp = calendar.events[i].dt_start.split("T")[1];
         tmp = tmp.substr(0, tmp.length - 1).split(":");
         dt_start.hour = tmp[0];
         dt_start.minutes = tmp[1];

         tmp = calendar.events[i].dt_end.split("T")[1];
         tmp = tmp.substr(0, tmp.length - 1).split(":");
         dt_end.hour = tmp[0];
         dt_end.minutes = tmp[1];

         var event_container = $("<div/>", { class: "event panel" });
         var start = $(".hour" + dt_start.hour);
         var t = start.position().top + ((dt_start.minutes/100) *  start.height());
         var end = $(".hour" + dt_end.hour);
         var e = (end.position().top +  + ((dt_end.minutes/100) *  end.height())) - t;
         event_container.css("top", t + "px");
         event_container.css("height", e + "px");
         event_container.append($("<div/>", { class: "panel-body" }).text(calendar.events[i].summary));
         $("#events").append(event_container);
    }

}
