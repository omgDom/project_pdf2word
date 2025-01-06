import spacy
import fitz
import numpy as np
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

class DocumentAIDetector:
    def __init__(self):
        try:
            # Load English language model
            self.nlp = spacy.load("en_core_web_sm")
            logger.info("Initialized spaCy model")
        except Exception as e:
            logger.error(f"Error loading spaCy model: {str(e)}")
            raise

    def analyze_document(self, pdf_path):
        """Analyze document structure and content using AI"""
        try:
            doc = fitz.open(pdf_path)
            page = doc[0]  # Start with first page
            
            # Extract text and structure
            blocks = page.get_text("dict")["blocks"]
            text_content = self._extract_text(blocks)
            
            # AI analysis
            doc_analysis = self.nlp(text_content)
            
            # Analyze layout and content
            analysis = {
                'document_type': self._detect_document_type(doc_analysis),
                'layout': self._analyze_layout(blocks),
                'sections': self._detect_sections(blocks, doc_analysis),
                'key_phrases': self._extract_key_phrases(doc_analysis),
                'style_suggestions': self._analyze_style(blocks)
            }
            
            return analysis
            
        except Exception as e:
            logger.error(f"Document analysis error: {str(e)}")
            raise
        finally:
            if 'doc' in locals():
                doc.close()

    def _extract_text(self, blocks):
        """Extract and clean text from blocks"""
        text = []
        for block in blocks:
            if block.get("type") == 0:  # text block
                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        text.append(span.get("text", "").strip())
        return " ".join(text)

    def _detect_document_type(self, doc_analysis):
        """Use NLP to detect document type"""
        # Count relevant entities and keywords
        entity_counts = defaultdict(int)
        keyword_scores = {
            'resume': ['experience', 'education', 'skills', 'work', 'cv'],
            'letter': ['dear', 'sincerely', 'regards', 'thank you'],
            'report': ['analysis', 'findings', 'conclusion', 'summary'],
            'article': ['abstract', 'introduction', 'methodology', 'references']
        }
        
        # Analyze entities
        for ent in doc_analysis.ents:
            entity_counts[ent.label_] += 1
        
        # Score document types
        type_scores = defaultdict(float)
        text_lower = doc_analysis.text.lower()
        
        for doc_type, keywords in keyword_scores.items():
            score = sum(text_lower.count(kw) for kw in keywords)
            type_scores[doc_type] = score
        
        # Determine document type
        if type_scores['resume'] > 2:
            return 'resume'
        elif type_scores['letter'] > 2:
            return 'letter'
        elif type_scores['report'] > 2:
            return 'report'
        elif type_scores['article'] > 2:
            return 'article'
        return 'general'

    def _analyze_layout(self, blocks):
        """Analyze document layout structure"""
        try:
            layout = {
                'columns': self._detect_columns(blocks),
                'headers': self._detect_headers(blocks),
                'lists': self._detect_lists(blocks) if hasattr(self, '_detect_lists') else [],
                'paragraphs': self._detect_paragraphs(blocks) if hasattr(self, '_detect_paragraphs') else []
            }
            return layout
        except Exception as e:
            logger.error(f"Layout analysis error: {str(e)}")
            return {
                'columns': 1,
                'headers': [],
                'lists': [],
                'paragraphs': []
            }

    def _detect_columns(self, blocks):
        """Detect column layout"""
        x_positions = []
        for block in blocks:
            if block.get("type") == 0:
                x0 = block["bbox"][0]
                x_positions.append(x0)
        
        if not x_positions:
            return 1
            
        # Use clustering to detect columns
        x_positions = np.array(x_positions)
        unique_positions = np.unique(x_positions)
        
        if len(unique_positions) < 3:
            return 1
        elif len(unique_positions) < 5:
            return 2
        return 3

    def _detect_sections(self, blocks, doc_analysis):
        """Detect document sections using NLP"""
        sections = []
        current_section = None
        
        for block in blocks:
            if block.get("type") == 0:
                text = self._extract_text([block])
                
                # Analyze text
                block_analysis = self.nlp(text)
                
                # Check if this is a section header
                if self._is_section_header(block, block_analysis):
                    if current_section:
                        sections.append(current_section)
                    current_section = {
                        'title': text,
                        'content': [],
                        'level': self._determine_section_level(block)
                    }
                elif current_section:
                    current_section['content'].append(text)
        
        if current_section:
            sections.append(current_section)
        
        return sections

    def _extract_key_phrases(self, doc_analysis):
        """Extract important phrases using NLP"""
        key_phrases = []
        
        for chunk in doc_analysis.noun_chunks:
            if chunk.root.dep_ in ('nsubj', 'dobj'):
                key_phrases.append(chunk.text)
        
        return key_phrases[:10]  # Return top 10 key phrases

    def _analyze_style(self, blocks):
        """Analyze document style and formatting"""
        styles = {
            'font_sizes': set(),
            'font_names': set(),
            'text_alignment': defaultdict(int),
            'formatting': defaultdict(int)
        }
        
        for block in blocks:
            if block.get("type") == 0:
                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        if 'size' in span:
                            styles['font_sizes'].add(span['size'])
                        if 'font' in span:
                            styles['font_names'].add(span['font'])
        
        return styles

    def _is_section_header(self, block, block_analysis):
        """Determine if a block is a section header"""
        # Check text properties
        text = block_analysis.text
        if not text.strip():
            return False
            
        # Header criteria
        is_short = len(text.split()) < 6
        is_caps = text.isupper()
        has_colon = text.endswith(':')
        
        # Check formatting
        spans = block.get("lines", [{}])[0].get("spans", [{}])[0]
        is_large_font = spans.get("size", 11) > 11
        is_bold = spans.get("flags", 0) & 2**4
        
        return (is_short and (is_caps or is_large_font or is_bold or has_colon))

    def _determine_section_level(self, block):
        """Determine section heading level"""
        spans = block.get("lines", [{}])[0].get("spans", [{}])[0]
        size = spans.get("size", 11)
        
        if size > 14:
            return 1
        elif size > 12:
            return 2
        return 3 

    def _detect_headers(self, blocks):
        """Detect headers in the document"""
        headers = []
        
        try:
            for block in blocks:
                if block.get("type") == 0:  # text block
                    for line in block.get("lines", []):
                        for span in line.get("spans", []):
                            text = span.get("text", "").strip()
                            if not text:
                                continue
                            
                            # Check header criteria
                            size = span.get("size", 11)
                            flags = span.get("flags", 0)
                            is_bold = bool(flags & 2**4)
                            is_large = size > 11
                            is_caps = text.isupper()
                            
                            if (is_bold or is_large or is_caps) and len(text.split()) < 6:
                                headers.append({
                                    'text': text,
                                    'size': size,
                                    'bold': is_bold,
                                    'bbox': block.get("bbox"),
                                    'level': 1 if size > 14 else 2 if size > 12 else 3
                                })
        
            return headers
        
        except Exception as e:
            logger.error(f"Error detecting headers: {str(e)}")
            return [] 