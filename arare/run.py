
#
#
#
import subprocess, platform
from flask import Flask, render_template
app = Flask(__name__)

@app.route('/')
def index():
	return render_template('index.html')

if __name__ == '__main__':
	app.debug = True
	if platform.system() == 'Darwin':
		try:
			subprocess.check_call(['open', 'http://localhost:8080'])
			pass
		except:
			pass
	elif platform.system() == 'Windows':
		try:
			subprocess.check_call(['start', 'http://localhost:8080'])
			pass
		except:
			pass

	app.run(host='0.0.0.0', port=8080)