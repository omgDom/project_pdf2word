from datetime import datetime
import json
import os
import fitz
import hashlib
from collections import defaultdict
import logging
import uuid

logger = logging.getLogger(__name__)

class ResumeAnalyzer:
    def __init__(self):
        self.analysis_results = {}
        self.doc_id = None
        self.data_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data', 'layout_patterns.json')
        self.load_patterns()
        
    def load_patterns(self):
        """Load existing layout patterns"""
        try:
            if os.path.exists(self.data_file):
                with open(self.data_file, 'r') as f:
                    self.patterns = json.load(f)
            else:
                self.patterns = {
                    'layouts': defaultdict(int),
                    'sections': defaultdict(list),
                    'styles': defaultdict(list),
                    'ratings': defaultdict(list),
                    'metadata': {
                        'total_analyzed': 0,
                        'last_updated': None
                    }
                }
        except Exception as e:
            logger.error(f"Error loading patterns: {str(e)}")
            self.patterns = defaultdict(dict)

    def _generate_doc_id(self):
        """Generate a unique document ID for tracking"""
        return str(uuid.uuid4())

    def analyze_and_store(self, pdf_path):
        """Analyze PDF and store results for later use"""
        try:
            self.doc_id = self._generate_doc_id()
            
            # Basic document analysis
            analysis = self.analyze_document(pdf_path)
            
            # Store analysis results
            self.analysis_results[self.doc_id] = analysis
            
            # Update pattern database
            self._update_pattern_database(analysis)
            
            return analysis
            
        except Exception as e:
            logger.error(f"Analysis error: {str(e)}")
            return None

    def analyze_document(self, pdf_path):
        """Analyze PDF structure and content"""
        try:
            # Initialize analysis dictionary
            analysis = {
                'document_id': self.doc_id or self._generate_doc_id(),
                'timestamp': datetime.now().isoformat(),
                'filename': os.path.basename(pdf_path),
                'layout': {},
                'content': {},
                'metadata': {},
                'suggestions': {}
            }
            
            # Open the PDF
            doc = fitz.open(pdf_path)
            
            # Document metadata
            analysis['metadata'] = {
                'title': doc.metadata.get('title', ''),
                'author': doc.metadata.get('author', ''),
                'creator': doc.metadata.get('creator', ''),
                'producer': doc.metadata.get('producer', ''),
                'page_count': doc.page_count,
                'file_size': os.path.getsize(pdf_path)
            }
            
            # Analysis for first page (usually sufficient for resumes)
            if doc.page_count > 0:
                page = doc[0]
                
                # Get page dimensions
                analysis['layout']['dimensions'] = {
                    'width': page.rect.width,
                    'height': page.rect.height
                }
                
                # Analyze page structure
                blocks = page.get_text("dict")["blocks"]
                
                # Determine if multi-column layout
                x_positions = [block["bbox"][0] for block in blocks if block.get("type") == 0]
                distinct_x = set([round(x, -1) for x in x_positions])  # Round to nearest 10
                
                if len(distinct_x) == 1:
                    analysis['layout']['type'] = 'single_column'
                elif len(distinct_x) == 2:
                    analysis['layout']['type'] = 'two_column'
                else:
                    analysis['layout']['type'] = 'multi_column'
                
                # Extract content sections (basic)
                text_blocks = []
                for block in blocks:
                    if block.get("type") == 0:  # Text block
                        text = ""
                        for line in block.get("lines", []):
                            for span in line.get("spans", []):
                                text += span.get("text", "") + " "
                        
                        text_blocks.append({
                            'text': text.strip(),
                            'bbox': block["bbox"],
                            'font_size': self._get_avg_font_size(block),
                            'is_bold': self._has_bold_text(block)
                        })
                
                analysis['content']['text_blocks'] = text_blocks
                
                # Extract section headings (simple heuristic)
                headings = []
                for block in text_blocks:
                    if block['is_bold'] or block['font_size'] > 12:
                        headings.append({
                            'text': block['text'],
                            'bbox': block['bbox']
                        })
                
                analysis['content']['headings'] = headings
                
                # Generate suggestions based on analysis
                analysis['suggestions'] = self._generate_suggestions(analysis)
            
            doc.close()
            return analysis
            
        except Exception as e:
            logger.error(f"Document analysis error: {str(e)}")
            return {
                'document_id': self.doc_id or self._generate_doc_id(),
                'error': str(e)
            }

    def _get_avg_font_size(self, block):
        """Calculate average font size in a block"""
        sizes = []
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                if "size" in span:
                    sizes.append(span["size"])
        
        return sum(sizes) / len(sizes) if sizes else 0

    def _has_bold_text(self, block):
        """Check if block contains bold text"""
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                # Bold flag is usually bit 4 (16)
                if span.get("flags", 0) & 16:
                    return True
        return False

    def _generate_suggestions(self, analysis):
        """Generate formatting suggestions based on analysis"""
        suggestions = {
            'layout': {},
            'styling': {},
            'sections': {}
        }
        
        # Layout suggestions
        layout_type = analysis['layout'].get('type', 'single_column')
        if layout_type == 'two_column':
            suggestions['layout'] = {
                'type': 'two_column',
                'columns': 2,
                'column_widths': [0.3, 0.7],  # Common resume layout
                'margins': {
                    'top': 36,
                    'bottom': 36,
                    'left': 36,
                    'right': 36
                }
            }
        elif layout_type == 'single_column':
            suggestions['layout'] = {
                'type': 'single_column',
                'columns': 1,
                'margins': {
                    'top': 48,
                    'bottom': 48,
                    'left': 72,
                    'right': 72
                }
            }
        
        # Extract section types (simple)
        sections = {}
        headings = analysis['content'].get('headings', [])
        for heading in headings:
            heading_text = heading['text'].lower()
            
            # Match common resume section titles
            section_type = 'general'
            if any(kw in heading_text for kw in ['experience', 'work', 'employment']):
                section_type = 'experience'
            elif any(kw in heading_text for kw in ['education', 'academic', 'studies']):
                section_type = 'education'
            elif any(kw in heading_text for kw in ['skill', 'competenc', 'proficienc']):
                section_type = 'skills'
            elif any(kw in heading_text for kw in ['language', 'idioma', 'språk']):
                section_type = 'languages'
            elif any(kw in heading_text for kw in ['profile', 'summary', 'about', 'objective']):
                section_type = 'profile'
            elif any(kw in heading_text for kw in ['contact', 'personal', 'details']):
                section_type = 'contact'
            
            sections[heading['text']] = {
                'type': section_type,
                'style': {
                    'bold': True,
                    'font_size': 14,
                    'spacing_after': 8
                }
            }
        
        suggestions['sections'] = sections
        
        return suggestions

    def _update_pattern_database(self, analysis):
        """Update the pattern database with new data"""
        try:
            if not os.path.exists(self.data_file):
                # Create initial database
                data = {
                    'layouts': {},
                    'sections': {},
                    'styles': {},
                    'ratings': {},
                    'metadata': {
                        'total_analyzed': 0,
                        'last_updated': None
                    }
                }
            else:
                # Load existing database
                with open(self.data_file, 'r') as f:
                    data = json.load(f)
            
            # Update layout patterns
            layout_type = analysis['layout'].get('type')
            if layout_type:
                data['layouts'][layout_type] = data['layouts'].get(layout_type, 0) + 1
            
            # Update section patterns
            for heading in analysis['content'].get('headings', []):
                heading_text = heading['text'].lower()
                data['sections'][heading_text] = data['sections'].get(heading_text, 0) + 1
            
            # Update metadata
            data['metadata']['total_analyzed'] = data['metadata'].get('total_analyzed', 0) + 1
            data['metadata']['last_updated'] = datetime.now().isoformat()
            
            # Save updated data
            with open(self.data_file, 'w') as f:
                json.dump(data, f, indent=2)
                
        except Exception as e:
            logger.warning(f"Error updating pattern database: {str(e)}")

    def _analyze_layout(self, blocks):
        """Analyze document layout structure"""
        x_positions = [block["bbox"][0] for block in blocks]
        distinct_x = set([round(x, -1) for x in x_positions])
        
        layout = {
            'type': 'single_column' if len(distinct_x) == 1 else 'multi_column',
            'columns': len(distinct_x),
            'coordinates': self._get_column_coordinates(blocks),
            'distribution': self._analyze_content_distribution(blocks)
        }
        
        return layout

    def _analyze_patterns(self, blocks):
        """Analyze recurring patterns"""
        patterns = {
            'bullet_points': self._detect_bullet_patterns(blocks),
            'ratings': self._detect_rating_patterns(blocks),
            'spacing': self._analyze_spacing_patterns(blocks),
            'headers': self._analyze_header_patterns(blocks)
        }
        return patterns

    def _update_patterns(self, analysis, doc_id):
        """Update pattern database with new analysis"""
        self.patterns['layouts'][analysis['layout']['type']] += 1
        
        # Update section patterns
        for section in analysis['sections']:
            section_data = {
                'type': section['type'],
                'position': section['position'],
                'styling': section['styling'],
                'doc_id': doc_id
            }
            self.patterns['sections'][section['type']].append(section_data)
        
        # Update style patterns
        self.patterns['styles'][doc_id] = analysis['styling']
        
        # Update metadata
        self.patterns['metadata']['total_analyzed'] += 1
        self.patterns['metadata']['last_updated'] = datetime.now().isoformat()

    def _save_patterns(self):
        """Save updated patterns to database"""
        try:
            os.makedirs(os.path.dirname(self.data_file), exist_ok=True)
            with open(self.data_file, 'w') as f:
                json.dump(self.patterns, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving patterns: {str(e)}") 