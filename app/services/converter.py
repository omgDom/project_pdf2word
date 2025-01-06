import fitz  # PyMuPDF
from docx import Document
from docx.shared import Pt, Cm, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.style import WD_STYLE_TYPE
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
import cv2
import numpy as np
from PIL import Image
import io
import logging
import os

logger = logging.getLogger(__name__)

class DocumentConverter:
    def __init__(self):
        self.color_scheme = None
        self.shape_patterns = None
        self.section_styles = {}
        try:
            # Initialize OpenCV and other dependencies
            import cv2
            import numpy as np
            from PIL import Image
        except ImportError as e:
            logger.error(f"Missing dependency: {str(e)}")
            raise

    def convert(self, input_path, output_path, target_format=None):
        """Main conversion method called by the routes"""
        try:
            logger.info(f"Starting conversion from {input_path} to {output_path}")
            
            # Validate input file
            if not os.path.exists(input_path):
                raise FileNotFoundError(f"Input file not found: {input_path}")
            
            # Ensure output directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # Analyze design and convert
            if target_format and target_format.lower() == 'docx':
                return self.convert_to_docx(input_path, output_path)
            else:
                logger.error(f"Unsupported format: {target_format}")
                raise ValueError(f"Unsupported format: {target_format}")
                
        except Exception as e:
            logger.error(f"Conversion error: {str(e)}")
            raise

    def analyze_resume_design(self, pdf_path):
        """Analyze resume design elements"""
        pdf = fitz.open(pdf_path)
        try:
            # Get first page for design analysis
            page = pdf[0]
            pix = page.get_pixmap()
            
            # Convert to image for analysis
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            np_img = np.array(img)
            
            # Analyze design elements
            self.color_scheme = self._detect_color_scheme(np_img)
            self.shape_patterns = self._detect_shapes(np_img)
            self.section_styles = self._analyze_section_styles(page)
            
            return {
                'colors': self.color_scheme,
                'shapes': self.shape_patterns,
                'styles': self.section_styles
            }
            
        finally:
            pdf.close()

    def _detect_color_scheme(self, img):
        """Detect dominant colors and color scheme"""
        # Reshape image for color analysis
        pixels = img.reshape(-1, 3)
        
        # Use K-means to find dominant colors
        n_colors = 5
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 200, .1)
        flags = cv2.KMEANS_RANDOM_CENTERS
        _, labels, palette = cv2.kmeans(np.float32(pixels), n_colors, None, criteria, 10, flags)
        
        # Convert to RGB values
        colors = palette.astype(np.uint8)
        
        # Calculate color frequencies
        unique_labels, counts = np.unique(labels, return_counts=True)
        percentages = counts / counts.sum()
        
        # Create color scheme dictionary
        color_scheme = {
            'primary': colors[np.argmax(counts)].tolist(),
            'secondary': colors[np.argsort(counts)[-2]].tolist(),
            'accent': colors[np.argsort(counts)[-3]].tolist(),
            'text': self._determine_text_color(colors[np.argmax(counts)])
        }
        
        return color_scheme

    def _detect_shapes(self, img):
        """Detect shapes and layout patterns"""
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
        
        # Edge detection
        edges = cv2.Canny(gray, 50, 150)
        
        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        shapes = {
            'rectangles': [],
            'lines': [],
            'circles': []
        }
        
        for contour in contours:
            # Approximate shape
            peri = cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, 0.04 * peri, True)
            
            # Classify shapes
            if len(approx) == 4:
                x, y, w, h = cv2.boundingRect(approx)
                shapes['rectangles'].append({
                    'x': x, 'y': y,
                    'width': w, 'height': h
                })
            elif len(approx) == 2:
                shapes['lines'].append(approx.tolist())
            elif len(approx) > 8:
                shapes['circles'].append(cv2.minEnclosingCircle(contour))
        
        return shapes

    def convert_to_docx(self, input_path, output_path):
        """Convert PDF resume to DOCX with design preservation"""
        try:
            # Analyze resume design
            design = self.analyze_resume_design(input_path)
            
            # Create Word document
            doc = Document()
            
            # Set up page format
            section = doc.sections[0]
            section.page_width = Inches(8.5)
            section.page_height = Inches(11)
            section.left_margin = Inches(0.5)
            section.right_margin = Inches(0.5)
            
            # Apply design elements
            self._apply_design_elements(doc, design)
            
            # Process PDF content
            pdf = fitz.open(input_path)
            
            for page_num in range(pdf.page_count):
                self._process_resume_page(doc, pdf[page_num], design)
            
            doc.save(output_path)
            return True
            
        except Exception as e:
            logger.error(f"Resume conversion error: {str(e)}")
            raise

    def _apply_design_elements(self, doc, design):
        """Apply detected design elements to document"""
        # Create custom styles based on design
        styles = {
            'Header': {
                'font_size': 16,
                'color': design['colors']['primary'],
                'bold': True
            },
            'Section': {
                'font_size': 12,
                'color': design['colors']['secondary'],
                'bold': True
            },
            'Body': {
                'font_size': 11,
                'color': design['colors']['text'],
                'bold': False
            }
        }
        
        # Apply styles
        for style_name, properties in styles.items():
            style = doc.styles.add_style(f'Custom{style_name}', WD_STYLE_TYPE.PARAGRAPH)
            font = style.font
            font.size = Pt(properties['font_size'])
            font.color.rgb = RGBColor(*properties['color'])
            font.bold = properties['bold']

    def _process_resume_page(self, doc, page, design):
        """Process resume page with design elements"""
        blocks = page.get_text("dict")["blocks"]
        
        for block in blocks:
            if block.get("type") == 0:  # text block
                # Determine block style based on position and format
                style = self._determine_block_style(block, design)
                
                # Create paragraph with appropriate styling
                paragraph = doc.add_paragraph(style=f'Custom{style}')
                
                # Process text with formatting
                self._process_text_block(paragraph, block, design)
                
                # Add shape elements if needed
                if style == 'Section':
                    self._add_section_separator(doc, design)

    def _determine_block_style(self, block, design):
        """Determine appropriate style for text block"""
        # Get first span properties
        if block.get("lines") and block["lines"][0].get("spans"):
            span = block["lines"][0]["spans"][0]
            text = span.get("text", "").strip()
            size = span.get("size", 11)
            
            # Check for header (usually name at top)
            if size > 14 or (text.isupper() and len(text.split()) <= 3):
                return 'Header'
            
            # Check for section titles
            if text.isupper() and len(text.split()) <= 2:
                return 'Section'
        
        return 'Body'

    def _add_section_separator(self, doc, design):
        """Add visual separator between sections"""
        paragraph = doc.add_paragraph()
        run = paragraph.add_run()
        
        # Add line shape
        p = run._element
        r = p.add_r()
        pict = parse_xml(f'''
            <w:pict {nsdecls("v")}>
                <v:rect style="width:100%;height:2pt" 
                        fillcolor="#{self._rgb_to_hex(design['colors']['secondary'])}"
                        strokecolor="#{self._rgb_to_hex(design['colors']['secondary'])}"/>
            </w:pict>
        ''')
        r.append(pict)
        
        paragraph.space_after = Pt(12)

    def _rgb_to_hex(self, rgb):
        """Convert RGB to HEX color"""
        return '%02x%02x%02x' % tuple(rgb)

    def _determine_text_color(self, background):
        """Determine appropriate text color based on background"""
        # Calculate luminance
        luminance = (0.299 * background[0] + 0.587 * background[1] + 0.114 * background[2]) / 255
        
        # Use black text on light backgrounds, white text on dark backgrounds
        return [0, 0, 0] if luminance > 0.5 else [255, 255, 255]

    def _analyze_section_styles(self, page):
        """Analyze and detect section styles from PDF page"""
        section_styles = {}
        try:
            blocks = page.get_text("dict")["blocks"]
            
            for block in blocks:
                if block.get("type") == 0:  # text block
                    for line in block.get("lines", []):
                        for span in line.get("spans", []):
                            text = span.get("text", "").strip()
                            
                            # Skip empty spans
                            if not text:
                                continue
                                
                            # Analyze style properties
                            style_props = {
                                'font_size': span.get("size", 11),
                                'font_name': span.get("font", "Calibri"),
                                'is_bold': bool(span.get("flags", 0) & 2**4),
                                'is_italic': bool(span.get("flags", 0) & 2**1),
                                'color': span.get("color", 0),
                                'bbox': block.get("bbox"),
                                'alignment': self._detect_alignment(block)
                            }
                            
                            # Detect section headers
                            if (text.isupper() and len(text.split()) <= 2) or style_props['font_size'] > 11:
                                section_styles[text] = style_props
            
            return section_styles
            
        except Exception as e:
            logger.error(f"Error analyzing section styles: {str(e)}")
            # Return default styles if analysis fails
            return {
                'default_header': {
                    'font_size': 16,
                    'font_name': 'Calibri',
                    'is_bold': True,
                    'is_italic': False,
                    'color': 0,  # black
                    'alignment': 'left'
                },
                'default_section': {
                    'font_size': 12,
                    'font_name': 'Calibri',
                    'is_bold': True,
                    'is_italic': False,
                    'color': 0,
                    'alignment': 'left'
                }
            }

    def _detect_alignment(self, block):
        """Detect text alignment from block properties"""
        try:
            # Get block dimensions
            x0, _, x1, _ = block["bbox"]
            width = x1 - x0
            
            # Get page width (assuming standard page width if not available)
            page_width = 595  # Default A4 width in points
            
            # Calculate margins
            left_margin = x0
            right_margin = page_width - x1
            
            # Determine alignment
            if abs(left_margin - right_margin) < 20:  # Within 20 points tolerance
                return 'center'
            elif left_margin < right_margin:
                return 'left'
            else:
                return 'right'
            
        except Exception as e:
            logger.error(f"Error detecting alignment: {str(e)}")
            return 'left'  # Default to left alignment

    def _process_text_block(self, paragraph, block, design):
        """Process and format text block content"""
        try:
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    text = span.get("text", "").strip()
                    if not text:
                        continue
                    
                    # Create run for this text span
                    run = paragraph.add_run(text + " ")
                    
                    # Apply font properties
                    font = run.font
                    font.name = span.get("font", "Calibri")
                    font.size = Pt(span.get("size", 11))
                    
                    # Apply bold/italic
                    flags = span.get("flags", 0)
                    font.bold = bool(flags & 2**4)
                    font.italic = bool(flags & 2**1)
                    
                    # Apply color
                    if "color" in span:
                        color = span["color"]
                        if isinstance(color, int):
                            # Convert PDF color space to RGB
                            r = (color >> 16) & 0xFF
                            g = (color >> 8) & 0xFF
                            b = color & 0xFF
                            font.color.rgb = RGBColor(r, g, b)
                        else:
                            # Use design color scheme
                            font.color.rgb = RGBColor(*design['colors']['text'])
                    
            # Apply paragraph formatting
            paragraph.paragraph_format.space_after = Pt(6)
            paragraph.paragraph_format.space_before = Pt(6)
            paragraph.paragraph_format.line_spacing = 1.15
            
            # Apply alignment
            alignment = self._detect_alignment(block)
            if alignment == 'center':
                paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
            elif alignment == 'right':
                paragraph.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            else:
                paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT
            
        except Exception as e:
            logger.error(f"Error processing text block: {str(e)}")
            # Add text without formatting if error occurs
            paragraph.add_run(block.get("text", ""))