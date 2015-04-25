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
    from datetime import datetime
    
    data = request.get_data()
    # {user:user1, friends: [user1, user2]}
    data = json.loads(data)

    user_events = db_events_get(data['user'], None, None)
    friends_events = []
    for friend in data['friends']:
        friends_events.append((friend, db_events_get(friend, None, None)))
    breaks = gaps(user_events, friends_events)

    return json.dumps({'events': user_events, 'breaks': breaks})

@app.route('/check')
def check():
    return str(db_events_get('A', None, None))

def combine_ranges(xs):
    xs = sorted(xs, key=lambda x: x['dt_start'])
    print "combine_ranges >>>> " + str(xs)
    if not xs:
        return xs
    current = xs[0]
    combined = []
    for x in xs[1:]:
        if current['dt_start'] <= x['dt_start'] and x['dt_start'] <= current['dt_end']:
            # current['dt_start'] = min(current['dt_start'], x['dt_start'])
            current['dt_end'] = max(current['dt_end'], x['dt_end'])
        else:
            combined.append(current)
            current = x
    combined.append(current)
    return combined

def common_gaps(xs, ys, yname):
    combined = []
    combined.extend(xs)
    combined.extend(ys)
    combined = combine_ranges(combined)
    gaps = []
    dt_start = 0
    last = 24
    for x in combined:
        gaps.append({'dt_start': dt_start, 'dt_end': x['dt_start'], 'user': yname})
        dt_start = x['dt_end']
    gaps.append({'dt_start': dt_start, 'dt_end': last, 'user': yname})
    return gaps


def gaps(user_events, friends_events):
    # user_events = [{'uid': '007', 'dt_start':12, 'dt_end':13, 'summary':'A'}]
    # friends_events = [ 
    #     [{'uid': '42', 'dt_start':12, 'dt_end':13, 'summary':'B'}, 
    #     {'uid': '42', 'dt_start':11, 'dt_end':15, 'summary':'B'}]
    # ]
    print "gaps >>>>" + str(user_events) + "||||" + str(friends_events)
    gaps = [ common_gaps(user_events,friend_events, friend_name) for friend_name, friend_events in friends_events]
    return gaps


def db_events_get(user, dt_start, dt_end):
    link = DB_PATH+'/events/_search?pretty'

    es_query = {"query": { "bool": { "must": [
        {   "range": {
                "dt_start": { "gte": "2013-12-15T00:00:00"}
            }
        },
        {   "range": {
                "dt_end": { "lte": "2015-12-15T00:00:00"}
            }
        },
        {   "match": {
                "uid": user
            }
        }
    ] } } }

    r = requests.post(link, data=json.dumps(es_query))
    #es_response_ok(r)
    print "@@@@" + r.text
    resp = json.loads(r.text)['hits']['hits']
    return [ r['_source'] for r in resp ]


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
