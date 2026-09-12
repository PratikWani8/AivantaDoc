import io,fitz,cv2,numpy as np,pytesseract
from PIL import Image
from app.config import Settings
s=Settings()
if s.tesseract_cmd:pytesseract.pytesseract.tesseract_cmd=s.tesseract_cmd
def ocr_image(img):
    a=cv2.cvtColor(np.array(img.convert('RGB')),cv2.COLOR_RGB2BGR); g=cv2.cvtColor(a,cv2.COLOR_BGR2GRAY)
    g=cv2.GaussianBlur(g,(3,3),0); p=cv2.threshold(g,0,255,cv2.THRESH_BINARY+cv2.THRESH_OTSU)[1]
    return pytesseract.image_to_string(p,lang=s.ocr_languages).strip()
def extract(data,ext):
    if ext=='.pdf':
        d=fitz.open(stream=data,filetype='pdf'); out=[]
        for page in d:
            text=page.get_text('text').strip()
            if text: out.append(text)
            else:
                pix=page.get_pixmap(dpi=s.pdf_dpi,alpha=False)
                out.append(ocr_image(Image.open(io.BytesIO(pix.tobytes('png')))))
        d.close(); return '\n\n'.join(out).strip()
    return ocr_image(Image.open(io.BytesIO(data)))
