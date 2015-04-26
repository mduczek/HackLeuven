import json
import requests

from flask import render_template, request, make_response, jsonify
from collections import namedtuple

from app import app
from ical import convert_from_url, get_events

SAMPLE_CAL_URL="https://www.google.com/calendar/ical/9lovau0oeksle7jtms8h094cu8%40group.calendar.google.com/public/basic.ics"

@app.route('/', methods=['GET', 'POST'])
@app.route('/index', methods=['GET', 'POST'])
def index():
    return render_template('index.html')

@app.route("/calendar")
def calendar():
    cal = convert_from_url(SAMPLE_CAL_URL)
    return render_template("calendar.html", my_cal=cal)

@app.route("/contact")
def contact():
    return render_template("contact.html")

@app.route("/settings")
def settings():
    return render_template("settings.html")

@app.route("/about")
def about():
    return render_template("index.html")

DB_PATH = "https://7ti5720l:p1lkxlff673oyj9z@yew-8681597.us-east-1.bonsai.io/leuvenhack"

@app.route('/db', methods=['POST'])
def db():
    data = request.get_data()
    db_req = json.loads(data)
    link = DB_PATH+'/'+db_req['index']
    if db_req['method'] == 'GET':
        r = requests.get(link)
        return r.text
    elif db_req['method'] == 'POST':
        r = requests.post(link, data=db_req['query'])
        return r.text
    elif db_req['method'] == 'PUT':
        r = requests.put(link, data=db_req['query'])
        return r.text


DATA_TYPES = namedtuple('DATA_TYPES', "ics, link")(ics='ics', link='link')

def db_events_put(user, ics):
    link = DB_PATH+'/events/_query'
    es_query = { "query" : { "term" : { "uid" : user }}}

    r = requests.delete(link, data=json.dumps(es_query))

    # upload
    events = get_events(ics)
    for event in events:
        event['uid'] = user

    link = DB_PATH+'/events/'
    res = ''
    for event in events:
        r = requests.post(link, data=json.dumps(event))
        if r.status_code != requests.codes.created:
            raise Exception(r.text)
        res += r.text +"||||"

    return res

@app.route('/events', methods=['POST'])
def events_get():
    from datetime import datetime, timedelta

    # { user: user1, friends: [user2, user3], range_back: -h, range_ahead: +h }
    data = request.get_data()
    data = json.loads(data)

    dt_now = datetime.now()
    dt_start = dt_now - timedelta(hours=int(data['range_back'])) if data.get('range_back') else dt_now - timedelta(hours=1)
    dt_end = dt_now + timedelta(hours=int(data['range_ahead'])) if data.get('range_ahead') else dt_now + timedelta(hours=12)

    user_events = db_events_get(data['user'], dt_start, dt_end)
    friends_events = []
    for friend in data['friends']:
        friends_events.append((friend, db_events_get(friend, dt_start, dt_end)))
    user_ev = list(user_events)
    breaks = gaps(user_events, friends_events, dt_start, dt_end)

    change_date_format(user_events)
    for b in breaks:
        change_date_format(b)

    return json.dumps({'events': user_ev, 'breaks': breaks})

def change_date_format(xs):
    def change_field(x, field):
        dt = strptime(x[field], '%Y-%m-%dT%H:%M:%S')
        x[field] = strftime('%d/%m/%Y %H:%M', dt)

    from time import strptime, strftime
    for x in xs:
        change_field(x, 'dt_start')
        change_field(x, 'dt_end')

@app.route('/check')
def check():
    return str(db_events_get('A', None, None))

def merge_intervals(intervals):
    intervals = sorted(intervals, key=lambda x: x['dt_start'])

    if not intervals:
        return intervals

    merged = []
    current = intervals[0]
    for interval in intervals[1:]:
        if current['dt_start'] <= interval['dt_start'] and interval['dt_start'] <= current['dt_end']:
            current['dt_end'] = max(current['dt_end'], interval['dt_end'])
        else:
            merged.append(current)
            current = interval
    merged.append(current)

    return merged

def common_gaps(my_intervals, friend_intervals, friend_uid, dt_start, dt_end):

    combined = []
    combined.extend(my_intervals)
    combined.extend(friend_intervals)
    combined = merge_intervals(combined)

    gaps = []
    last = dt_start
    from datetime import datetime

    print("===>" + str(type(dt_start)))

    for x in combined:
        print x['dt_start'].split(".")[0]

        x_start = datetime.strptime(x['dt_start'].split(".")[0], '%Y-%m-%dT%H:%M:%S')

        print("===A" + str(type(x_start)))
        print("===B" + str(type(last)))
        print("****"+str(last))
        delta = x_start - last
        print(last)
        print(x_start)
        if delta.total_seconds()/60 > 30:
            gaps.append({'dt_start': last.strftime('%Y-%m-%dT%H:%M:%S'), 'dt_end': x['dt_start'], 'user': friend_uid})
        last = datetime.strptime(x['dt_end'].split(".")[0], '%Y-%m-%dT%H:%M:%S')
        print(")))" + str(last))

    delta = dt_end - last
    if delta.total_seconds()/60 > 30:
        gaps.append({'dt_start': last.strftime('%Y-%m-%dT%H:%M:%S'),
                     'dt_end': dt_end.strftime('%Y-%m-%dT%H:%M:%S'), 'user': friend_uid})

    return gaps


def gaps(user_events, friends_events, dt_start, dt_end):
    # user_events = [{'uid': '007', 'dt_start':12, 'dt_end':13, 'summary':'A'}]
    # friends_events = [
    #     [{'uid': '42', 'dt_start':12, 'dt_end':13, 'summary':'B'},
    #     {'uid': '42', 'dt_start':11, 'dt_end':15, 'summary':'B'}]
    # ]
    print "gaps >>>>" + str(user_events) + "||||" + str(friends_events)
    print("===" + str(type(dt_start)))
    gaps = [ common_gaps(user_events,friend_events, friend_name, dt_start, dt_end) for friend_name, friend_events in friends_events]
    return gaps


def db_events_get(user, dt_start, dt_end):
    link = DB_PATH + '/events/_search?pretty'

    print "====="
    print dt_start
    print dt_end
    print "====="

    es_query = {
        "query": {
            "filtered": {
                "query": {
                    "match": { "uid": user }
                },
                "filter": {
                    "bool": {
                        "must": [
                            {
                                "range":  { "dt_start": { "gte": dt_start.strftime('%Y-%m-%dT%H:%M:%S') } }
                            },
                            {
                                "range":  { "dt_end": { "lte": dt_end.strftime('%Y-%m-%dT%H:%M:%S') } }
                            }
                        ]
                    }
                }
            }
        }
    }

    # es_query = { "filter": { "bool": { "must": [
    #     { "range": { "dt_start": { "gte": dt_start.strftime('%Y-%m-%dT%H:%M:%S') } } },
    #     { "range": { "dt_end": { "lte": dt_end.strftime('%Y-%m-%dT%H:%M:%S') } } },
    #     { "match": { "uid": user } }
    # ] } } }

    from datetime import datetime
    import time

    r = requests.post(link, data=json.dumps(es_query))
    print r.text
    resp = json.loads(r.text)['hits']['hits']
    out = []
    for r in resp:
        x = r['_source']
        start = datetime.strptime(x['dt_start'], '%Y-%m-%dT%H:%M:%S')
        end = datetime.strptime(x['dt_end'], '%Y-%m-%dT%H:%M:%S')
        print "S1>>" + str(start)
        print "S2>>" + str(end)
        print "S3>>" + str(time.mktime(dt_start.timetuple()))
        print "S4>>" + str(time.mktime(dt_end.timetuple()))
        if start > dt_start and end < dt_end:
            out.append(x)
    print "--->" + str(out)
    return out

    #r = requests.post(link, data=json.dumps(es_query))
    app.logger.debug("DT SEARCH : " + r.text)
    # resp = json.loads(r.text)['hits']['hits']
    # return [r['_source'] for r in resp]


@app.route('/upload_ics', methods=['GET', 'POST'])
def upload_file():
    from werkzeug import secure_filename

    ALLOWED_EXTENSIONS = set(('ics',))

    def allowed_file(filename):
        return ('.' in filename) and \
           (filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS)

    if request.method == 'POST':
        _file = request.files['file']
        user = request.form['user']
        print _file.filename
        if _file and allowed_file(_file.filename):
            filename = secure_filename(_file.filename)
            ics_str = _file.stream.getvalue().decode("utf-8")
            print ics_str[:200]
            db_events_put(user, ics_str)

            return jsonify(status="ok"), 200 # make_response('uploaded_file: ' + str(db_events_get(user, None, None)))
        else:
            return jsonify(status="invalid file"), 296 #make_response("invalid file!")

    return jsonify(status="unknown"), 420
