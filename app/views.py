from app import app, ical
from flask import render_template, request
import requests
import json

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
