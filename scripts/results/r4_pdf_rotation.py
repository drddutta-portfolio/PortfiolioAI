"""Use PDF-declared right-angle rotation for native word coordinates only."""
import json,hashlib
import fitz

class DeclaredRotationPage:
    def __init__(self,page):
        self.page=page;self.rotation=page.rotation
        if self.rotation not in (0,90,180,270):raise ValueError('PDF_DECLARED_ROTATION_UNAPPROVED')
        original=page.get_text('words');self.words=[]
        for word in original:
            rect=fitz.Rect(word[:4])*page.rotation_matrix
            if rect.is_empty or rect.is_infinite:raise ValueError('PDF_ROTATED_WORD_BOUNDS_UNPROVEN')
            self.words.append((*rect,*word[4:]))
        # The order and every character of every text/glyph token is preserved.
        if [w[4:] for w in original]!=[w[4:] for w in self.words]:raise ValueError('PDF_ROTATION_CHANGED_WORD_TEXT')
        self.evidence={'contract':'PDF_DECLARED_RIGHT_ANGLE_WORD_COORDINATES_V1','rotation_degrees':self.rotation,
            'word_text_sha256':hashlib.sha256(json.dumps([w[4:] for w in original],ensure_ascii=False,separators=(',',':')).encode()).hexdigest(),
            'coordinates_transformed_only':True,'amount_characters_changed':False}
    def get_text(self,kind='text',**kwargs):
        return list(self.words) if kind=='words' else self.page.get_text(kind,**kwargs)
    def get_pixmap(self,**kwargs):
        if kwargs.get('clip') is not None and self.rotation:raise ValueError('ROTATED_CAPTION_REGION_REQUIRES_SEPARATE_REPLAY')
        return self.page.get_pixmap(**kwargs)
