import urllib.request
import os

file_path = os.path.join('dataset', 'starter-datasets', 'delhivery', '03-delhivery-q4-fy24-earnings-presentation.pdf')
boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
headers = {'Content-Type': 'multipart/form-data; boundary=' + boundary}

with open(file_path, 'rb') as f:
    pdf_data = f.read()

body = (
    '--' + boundary + '\r\n' +
    'Content-Disposition: form-data; name="file"; filename="' + os.path.basename(file_path) + '"\r\n' +
    'Content-Type: application/pdf\r\n\r\n'
).encode('utf-8') + pdf_data + ('\r\n--' + boundary + '--\r\n').encode('utf-8')

req = urllib.request.Request('http://127.0.0.1:8000/api/ingest', data=body, headers=headers, method='POST')
res = urllib.request.urlopen(req)
print("Ingestion API Response:")
print(res.read().decode())
