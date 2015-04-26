import json
import os

from flask import abort
from icalendar import Calendar, vDatetime, Event
from icalendar.cal import Component
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
    ical = Calendar.from_ical(ics)
    iev = Event.from_ical(ics)

    for ev in ical.walk("VEVENT"):
        app.logger.debug(ev["SUMMARY"])
        app.logger.debug(ev["DTSTART"].dt)
        app.logger.debug(ev["DTEND"].dt)
        #app.logger.debug(ev["LOCATION"])
        app.logger.debug(type(ev['DTEND'].dt))

    data = {}
    data[ical.name] = dict(ical.items())
    for component in ical.subcomponents:
        if not data[ical.name].has_key(component.name):
            data[ical.name][component.name] = []
            comp_obj = {}
        for item in component.items():
            comp_obj[item[0]] = unicode(item[1])
            data[ical.name][component.name].append(comp_obj)

    # app.logger.debug(json.dumps(data))

    return json.dumps(data)

def get_events(ics):
    ical = Calendar.from_ical(ics)

    events = []
    for ical_ev in ical.walk('VEVENT'):
        if not ical_ev['DTSTART'] or not ical_ev['DTEND']:
            continue

        ev = {}
        ev['summary'] = ical_ev['SUMMARY'] if ical_ev['SUMMARY'] else ''
        ev['location'] = ical_ev['LOCATION'] if ical_ev['LOCATION'] else ''
        ev['dt_start'] = (ical_ev['DTSTART'].dt).strftime('%Y-%m-%dT%H:%M:%S')
        ev['dt_end'] = (ical_ev['DTEND'].dt).strftime('%Y-%m-%dT%H:%M:%S')

        app.logger.debug(ev['summary'])

        events.append(ev)

    return events

#def intersect(my_cal, other_cals):
