from app import app, ical
from flask import render_template, request, make_response
import requests
import json
from collections import namedtuple

SAMPLE_CAL_URL="https://www.google.com/calendar/ical/9lovau0oeksle7jtms8h094cu8%40group.calendar.google.com/public/basic.ics"

@app.route('/', methods=['GET', 'POST'])
@app.route('/index', methods=['GET', 'POST'])
def index():
    my_cal = ical.convert_from_url(SAMPLE_CAL_URL)
    return render_template('index.html', my_cal=my_cal)

@app.route("/contact")
def contact():
    return render_template("contact.html")

@app.route("/settings")
def settings():
    return render_template("settings.html")

@app.route("/about")
def about():
    return render_template("index.html")

@app.route('/db', methods=['POST'])
def db():
    db_path = "https://7ti5720l:p1lkxlff673oyj9z@yew-8681597.us-east-1.bonsai.io/leuvenhack"
    data = request.get_data()
    db_req = json.loads(data)
    link = db_path+'/'+db_req['index']
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
def db_put(user, data_type, data):
    assert data_type in DATA_TYPES
    link = db_path+'/cals/'+user
    entry = {
        'user': user,
        'type': data_type,
        'data': data
    }
    r = requests.post(link, data=json.dumps(entry))
    assert r.status_code == requests.codes.ok
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
        print _file.filename
        if _file and allowed_file(_file.filename):
            filename = secure_filename(_file.filename)
            ics_str = _file.stream.getvalue().decode("utf-8")
            print ics_str[:200]
            db_put('007','ics')
            return make_response('uploaded_file ' + filename)
    else:
        return '''
        <!doctype html>
        <title>Upload new File</title>
        <h1>Upload new File</h1>
        <form action="" method=post enctype=multipart/form-data>
          <p><input type=file name=file accept=".ics">
             <input type=submit value=Upload>
        </form>
        '''
