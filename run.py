from app import app

app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024 #1 MB
app.run(debug=True)
