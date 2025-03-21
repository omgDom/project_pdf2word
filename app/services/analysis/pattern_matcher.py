from collections import defaultdict
import numpy as np
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class PatternMatcher:
    def __init__(self, analyzer):
        self.analyzer = analyzer
        self.patterns = analyzer.patterns
        self.similarity_threshold = 0.75

    def find_best_match(self, new_analysis):
        """Find the best matching pattern for a new document"""
        try:
            matches = {
                'layout': self._match_layout(new_analysis['layout']),
                'sections': self._match_sections(new_analysis['sections']),
                'styling': self._match_styling(new_analysis['styling']),
                'patterns': self._match_patterns(new_analysis['patterns'])
            }
            
            # Calculate overall best match
            best_matches = self._calculate_best_matches(matches)
            
            return best_matches
            
        except Exception as e:
            logger.error(f"Pattern matching error: {str(e)}")
            return None

    def _match_layout(self, layout):
        """Match layout pattern"""
        layout_type = layout['type']
        similar_layouts = []
        
        # Find similar layouts from database
        for stored_layout in self.patterns['layouts']:
            if stored_layout['type'] == layout_type:
                similarity = self._calculate_layout_similarity(layout, stored_layout)
                if similarity >= self.similarity_threshold:
                    similar_layouts.append({
                        'layout': stored_layout,
                        'similarity': similarity
                    })
        
        return sorted(similar_layouts, key=lambda x: x['similarity'], reverse=True)

    def _match_sections(self, sections):
        """Match section patterns"""
        matched_sections = defaultdict(list)
        
        for section in sections:
            section_type = section['type']
            stored_sections = self.patterns['sections'].get(section_type, [])
            
            for stored_section in stored_sections:
                similarity = self._calculate_section_similarity(section, stored_section)
                if similarity >= self.similarity_threshold:
                    matched_sections[section_type].append({
                        'section': stored_section,
                        'similarity': similarity
                    })
        
        return matched_sections

    def get_conversion_suggestions(self, analysis):
        """Get conversion suggestions based on pattern matching"""
        matches = self.find_best_match(analysis)
        
        if not matches:
            return None
            
        suggestions = {
            'layout': self._get_layout_suggestions(matches['layout']),
            'styling': self._get_styling_suggestions(matches['styling']),
            'sections': self._get_section_suggestions(matches['sections'])
        }
        
        return suggestions

    def _get_layout_suggestions(self, layout_matches):
        """Generate layout conversion suggestions"""
        if not layout_matches:
            return None
            
        best_match = layout_matches[0]
        
        return {
            'type': best_match['layout']['type'],
            'columns': best_match['layout']['columns'],
            'margins': best_match['layout']['coordinates'].get('margins'),
            'spacing': best_match['layout']['coordinates'].get('spacing'),
            'confidence': best_match['similarity']
        } 