import matplotlib
matplotlib.use('Agg')  # Set the backend to Agg before importing pyplot
import matplotlib.pyplot as plt
import seaborn as sns
from collections import Counter, defaultdict
import json
import os
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class PatternVisualizer:
    def __init__(self, analyzer):
        try:
            self.analyzer = analyzer
            self.patterns = analyzer.patterns if hasattr(analyzer, 'patterns') else {}
            self.color_scheme = px.colors.qualitative.Set3
            
            # Ensure patterns structure exists
            self._initialize_patterns()
            
        except Exception as e:
            logger.error(f"Failed to initialize PatternVisualizer: {str(e)}")
            raise

    def _initialize_patterns(self):
        """Initialize pattern structure if not exists"""
        if not isinstance(self.patterns, dict):
            self.patterns = {}
            
        # Ensure all required keys exist
        required_keys = ['layouts', 'sections', 'styles', 'ratings']
        for key in required_keys:
            if key not in self.patterns:
                self.patterns[key] = {}

    def generate_dashboard(self, date_range='30', layout_type='all', section_filter='all'):
        """Generate a complete analytics dashboard with error handling"""
        try:
            visualizations = {}
            
            # Try to generate each visualization independently
            visualization_methods = {
                'layout_distribution': self.visualize_layout_distribution,
                'section_heatmap': self.visualize_section_positions,
                'style_trends': self.visualize_style_trends,
                'rating_patterns': self.visualize_rating_patterns,
                'font_usage': self.visualize_font_usage,
                'rating_distribution': self.visualize_rating_distribution
            }
            
            for name, method in visualization_methods.items():
                try:
                    visualizations[name] = method()
                except Exception as e:
                    logger.error(f"Failed to generate {name}: {str(e)}")
                    visualizations[name] = self._generate_error_visualization(str(e))
            
            return visualizations
            
        except Exception as e:
            logger.error(f"Dashboard generation failed: {str(e)}")
            return self._generate_fallback_dashboard()

    def _generate_error_visualization(self, error_message):
        """Generate an error message visualization"""
        return f"""
        <div class="error-visualization">
            <p>Failed to generate visualization</p>
            <p class="error-details">{error_message}</p>
        </div>
        """

    def _generate_fallback_dashboard(self):
        """Generate a minimal dashboard when main generation fails"""
        return {
            'error_message': self._generate_error_visualization(
                "Failed to generate dashboard. Please check the data and try again."
            )
        }

    def visualize_layout_distribution(self):
        """Visualize distribution of different layout types with error handling"""
        try:
            if not self.patterns.get('layouts'):
                return "<div>No layout data available</div>"
                
            layout_counts = Counter(
                layout.get('type', 'unknown') 
                for layout in self.patterns['layouts'].values()
                if isinstance(layout, dict)
            )
            
            if not layout_counts:
                return "<div>No valid layout data found</div>"
            
            fig = go.Figure(data=[
                go.Pie(
                    labels=list(layout_counts.keys()),
                    values=list(layout_counts.values()),
                    hole=.3
                )
            ])
            
            fig.update_layout(
                title="Resume Layout Distribution",
                annotations=[dict(text='Layouts', x=0.5, y=0.5, font_size=20, showarrow=False)]
            )
            
            return fig.to_html(full_html=False, include_plotlyjs='cdn')
            
        except Exception as e:
            logger.error(f"Layout distribution visualization failed: {str(e)}")
            return self._generate_error_visualization(str(e))

    def visualize_layout_evolution(self):
        """Visualize how layouts have evolved over time"""
        layout_data = []
        
        for doc_id, layout in self.patterns['layouts'].items():
            if 'timestamp' in layout:
                layout_data.append({
                    'date': pd.to_datetime(layout['timestamp']).date(),
                    'type': layout['type'],
                    'columns': layout.get('columns', 1)
                })
        
        df = pd.DataFrame(layout_data)
        
        fig = go.Figure()
        
        for layout_type in df['type'].unique():
            type_data = df[df['type'] == layout_type]
            
            fig.add_trace(go.Scatter(
                x=type_data['date'],
                y=type_data.groupby('date').size(),
                name=layout_type,
                mode='lines+markers',
                hovertemplate="Date: %{x}<br>Count: %{y}<extra></extra>"
            ))
        
        fig.update_layout(
            title="Layout Evolution Over Time",
            xaxis_title="Date",
            yaxis_title="Number of Resumes",
            hovermode='x unified',
            showlegend=True
        )
        
        return fig.to_html(full_html=False)

    def visualize_section_positions(self):
        """Create heatmap of section positions"""
        sections_data = []
        for section_type, instances in self.patterns['sections'].items():
            for instance in instances:
                if isinstance(instance, dict) and 'position' in instance:
                    sections_data.append({
                        'type': section_type,
                        'x': instance['position'].get('x', 0),
                        'y': instance['position'].get('y', 0)
                    })
        
        if not sections_data:
            return "<div>No section position data available</div>"
            
        df = pd.DataFrame(sections_data)
        
        fig = px.density_heatmap(
            df,
            x='x',
            y='y',
            facet_col='type',
            title='Section Position Patterns'
        )
        
        return fig.to_html(full_html=False)

    def visualize_section_frequency(self):
        """Visualize frequency and positioning of sections"""
        section_data = defaultdict(list)
        
        for doc_id, sections in self.patterns['sections'].items():
            for section in sections:
                section_data['type'].append(section['type'])
                section_data['position'].append(section['position']['y'])
                section_data['frequency'].append(1)
        
        df = pd.DataFrame(section_data)
        
        fig = go.Figure()
        
        # Add frequency bars
        fig.add_trace(go.Bar(
            x=df['type'].value_counts().index,
            y=df['type'].value_counts().values,
            name='Frequency',
            marker_color=self.color_scheme
        ))
        
        # Add position violin plots
        for section_type in df['type'].unique():
            section_positions = df[df['type'] == section_type]['position']
            
            fig.add_trace(go.Violin(
                x=[section_type] * len(section_positions),
                y=section_positions,
                name=f"{section_type} Position",
                side='positive',
                line_color='rgba(0,0,0,0)',
                showlegend=False
            ))
        
        fig.update_layout(
            title="Section Frequency and Position Distribution",
            xaxis_title="Section Type",
            yaxis_title="Count / Position",
            barmode='overlay',
            violinmode='overlay'
        )
        
        return fig.to_html(full_html=False)

    def visualize_style_trends(self):
        """Visualize styling patterns"""
        style_data = []
        for doc_id, style in self.patterns['styles'].items():
            if isinstance(style, dict):
                style_data.append({
                    'font': style.get('font_family', 'unknown'),
                    'size': style.get('font_size', 0),
                    'color': style.get('color', 'unknown')
                })
        
        if not style_data:
            return "<div>No style data available</div>"
            
        df = pd.DataFrame(style_data)
        
        fig = px.bar(
            df['font'].value_counts(),
            title='Font Usage Distribution'
        )
        
        return fig.to_html(full_html=False)

    def visualize_font_usage(self):
        """Visualize font usage patterns"""
        font_data = []
        for style in self.patterns['styles'].values():
            if isinstance(style, dict):
                font_data.append({
                    'font': style.get('font_family', 'unknown'),
                    'size': style.get('font_size', 0)
                })
        
        if not font_data:
            return "<div>No font data available</div>"
            
        df = pd.DataFrame(font_data)
        
        fig = px.histogram(
            df,
            x='size',
            color='font',
            title='Font Size Distribution'
        )
        
        return fig.to_html(full_html=False)

    def visualize_rating_patterns(self):
        """Visualize rating patterns"""
        rating_data = []
        for rating in self.patterns.get('ratings', {}).values():
            if isinstance(rating, list):
                for r in rating:
                    if isinstance(r, dict):
                        rating_data.append({
                            'section': r.get('section', 'unknown'),
                            'value': r.get('value', 0)
                        })
        
        if not rating_data:
            return "<div>No rating data available</div>"
            
        df = pd.DataFrame(rating_data)
        
        fig = px.box(
            df,
            x='section',
            y='value',
            title='Rating Distribution by Section'
        )
        
        return fig.to_html(full_html=False)

    def visualize_rating_distribution(self):
        """Visualize rating value distribution"""
        ratings = []
        for rating in self.patterns.get('ratings', {}).values():
            if isinstance(rating, list):
                ratings.extend([r.get('value', 0) for r in rating if isinstance(r, dict)])
        
        if not ratings:
            return "<div>No rating distribution data available</div>"
            
        fig = go.Figure(data=[
            go.Histogram(x=ratings)
        ])
        
        fig.update_layout(
            title="Rating Value Distribution",
            xaxis_title="Rating Value",
            yaxis_title="Frequency"
        )
        
        return fig.to_html(full_html=False)

    def generate_summary_statistics(self):
        """Generate summary statistics of patterns"""
        return {
            'total_resumes': len(self.patterns['layouts']),
            'popular_layouts': Counter(
                layout['type'] for layout in self.patterns['layouts'].values()
            ).most_common(3),
            'common_sections': Counter(
                section['type'] for sections in self.patterns['sections'].values()
                for section in sections
            ).most_common(5),
            'style_trends': {
                'fonts': Counter(
                    style.get('font_family', 'unknown')
                    for style in self.patterns['styles'].values()
                ).most_common(3),
                'colors': Counter(
                    style.get('color', 'unknown')
                    for style in self.patterns['styles'].values()
                ).most_common(3)
            },
            'last_updated': datetime.now().isoformat()
        }

    def _safe_get_value(self, dict_obj, key, default=None):
        """Safely get value from dictionary"""
        try:
            return dict_obj.get(key, default)
        except Exception:
            return default

    def _validate_data(self, data, required_keys=None):
        """Validate data structure"""
        if not isinstance(data, dict):
            return False
            
        if required_keys and not all(key in data for key in required_keys):
            return False
            
        return True 