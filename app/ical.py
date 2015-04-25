import json
import os

from flask import abort
from icalendar import Calendar, vDatetime
from urllib import urlopen

from app import app


def convert_from_url(url):
    if not url.startswith('http'):
        url = 'http://%s' % url

    uh = urlopen(url)
    if uh.getcode() != 200:
        abort(404)
    ics = uh.read()
    uh.close()

    return to_json(ics)

def to_json(ics):
    ical = Calendar.from_string(ics)

    data = {}
    data[ical.name] = dict(ical.items())
    for component in ical.subcomponents:
        if not data[ical.name].has_key(component.name):
            data[ical.name][component.name] = []
            comp_obj = {}
        for item in component.items():
            comp_obj[item[0]] = unicode(item[1])
            data[ical.name][component.name].append(comp_obj)

    app.logger.debug(json.dumps(data))

    return json.dumps(data)

#def intersect(my_cal, other_cals):
