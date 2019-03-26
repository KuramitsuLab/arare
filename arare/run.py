
#
#
#

# comment out
# from pegpy.origami.arare import compile

from flask import Flask, render_template, send_file, request, Response

app = Flask(__name__, template_folder='front/static')

@app.route('/')
def index():
	return render_template('index.html')

@app.route('/index.css')
def css():
	return send_file('front/static/index.css')

@app.route('/<path:d>')
def dist(d):
	return render_template(d)

@app.route('/compile', methods=['POST'])
def transcompile():
    inputText = request.form['source']
    if '(ArareCode)' in inputText:
            code = inputText
    else:
            code = compile(inputText)
    return Response(code, mimetype='application/javascript')

def main():
	app.run(host='0.0.0.0', port=8080, debug=True)

if __name__ == '__main__':
	main()
