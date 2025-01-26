from flask import Flask,render_template,request
import io
import PyPDF2
from docx import Document
from flask_sqlalchemy import SQLAlchemy
import datetime
import Email
import ollama

app = Flask(__name__)

db = SQLAlchemy()
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///DocSummary.db"
db.init_app(app)

loop = 0

class Inst(db.Model):
    sno = db.Column(db.Integer,primary_key=True)
    name = db.Column(db.String)
    email = db.Column(db.String,nullable = False)
    message = db.Column(db.String,nullable = False)
    time_created = db.Column(db.DateTime, default=datetime.datetime.now())

@app.route('/',methods = ['GET','POST'])
def index():
    with app.app_context():
        db.create_all()
    if(request.method == 'POST'):
        global loop
        loop  = loop + 1
        data = request.get_json()
        name = data['name']
        message = data['message']
        email = data['email']
        inst_first = Inst(sno = loop,name= name,message = message,email = email)
        db.session.add(inst_first)
        db.session.commit()

        Email.transfer(email)
    return render_template('index.html')

@app.route('/summarize',methods = ['GET','POST'])
def input():
    if request.method == 'POST':
        s = request.form.get('inputText', '')
        type_sum = request.form.get('type_sum', '')
        kp = request.form.get('kp', '')
        size = request.form.get('size', '')
        f = None

        if 'file' in request.files :
            f = request.files['file'] 

        prompt = "Please generate a " + size + " " + type_sum +  " summary in "  + kp + " for the following text: " + s

        if(f):
            uploaded_file_contents = f.read()

            if (f.filename.endswith('.pdf')):
                text = extract_text_from_pdf(uploaded_file_contents)
            elif f.filename.endswith('.docx'):
                text = extract_text_from_docx(uploaded_file_contents)
            else:
                text = extract_text_from_txt(uploaded_file_contents)
            s += text
            prompt += text
        
        prompt += " Make sure to adhere to the specified size and format. If the format is keypoints, number them as 1, 2, 3, etc. and If the format is paragraph, generate in distinct paragraphs. Also make sure that the length of summary you genrate must be less than the input text."

        def generate() :
            summary = ollama.chat(
                model="llama2", 
                messages=[{ "role":"user", "content":prompt}],
                stream=True
            )
            for chunk in summary :
                yield chunk['message']['content']
        
        return generate(), {"Content-Type":"text/plain"}

    return render_template('summarize.html')

@app.route('/about')
def about():
    return render_template('about.html')

def extract_text_from_pdf(pdf_content):
    text = ""
    pdf_file = io.BytesIO(pdf_content)  # Create an in-memory file-like object
    pdf_reader = PyPDF2.PdfReader(pdf_file)
    for page_num in range(len(pdf_reader.pages)):
        page = pdf_reader.pages[page_num]
        text += page.extract_text()
    return text

def extract_text_from_docx(docx_content):
    text = ""
    doc = Document(io.BytesIO(docx_content)) 
    for paragraph in doc.paragraphs:
        text += paragraph.text + '\n'
    return text

def extract_text_from_txt(txt_content):
    return txt_content.decode('utf-8')  


if __name__ == "__main__":
    app.run(debug=True,port=8000)