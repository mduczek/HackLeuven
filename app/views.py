import json
import requests

from flask import render_template, request, make_response
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

def db_events_get(user, dt_start, dt_end):
    link = DB_PATH+'/events/_search?pretty'
    
    es_query = {"query": { "bool": { "must": [
        {   "range": {
                "dt_start": { "gte": "2013-12-09T00:00:00.000Z" }
            }
        },
        {   "range": {
                "dt_end": { "lte": "2015-12-16T00:00:00.000Z" }
            }
        },
        {   "match": {
                "user": user
            }
        }
    ] } } }

    r = requests.post(link, data=json.dumps(es_query))
    #es_response_ok(r)
    return r.text


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

            return make_response('uploaded_file: ' + str(db_events_get(user, None, None)))
        else:
            return make_response("invalid file!")
    else:
        return '''
        <!doctype html>
        <title>Upload new File</title>
        <h1>Upload new File</h1>
        <form action="" method=post enctype=multipart/form-data>
          <p><input type=file name=file accept=".ics">
             <input type=text name=user>
             <input type=submit value=Upload>
        </form>
        '''
