from flask import Blueprint, render_template, request, jsonify, current_app
from ..services.analysis.pattern_visualizer import PatternVisualizer
from ..services.analysis.resume_analyzer import ResumeAnalyzer
import logging

logger = logging.getLogger(__name__)
analytics = Blueprint('analytics', __name__, url_prefix='/analytics')

@analytics.route('/')
def dashboard():
    try:
        # Initialize analyzer and visualizer
        analyzer = ResumeAnalyzer()
        visualizer = PatternVisualizer(analyzer)
        
        # Get filter parameters with defaults
        date_range = request.args.get('date_range', '30')
        layout_type = request.args.get('layout_type', 'all')
        section_filter = request.args.get('section', 'all')
        
        # Generate visualizations
        visualizations = visualizer.generate_dashboard(
            date_range=date_range,
            layout_type=layout_type,
            section_filter=section_filter
        )
        
        return render_template(
            'analytics/dashboard.html',
            visualizations=visualizations,
            current_filters={
                'date_range': date_range,
                'layout_type': layout_type,
                'section': section_filter
            }
        )
        
    except Exception as e:
        logger.error(f"Dashboard generation failed: {str(e)}")
        return render_template(
            'analytics/error.html',
            error_message=str(e)
        )

@analytics.route('/update_chart', methods=['POST'])
def update_chart():
    try:
        chart_id = request.json.get('chart_id')
        filters = request.json.get('filters', {})
        
        analyzer = ResumeAnalyzer()
        visualizer = PatternVisualizer(analyzer)
        
        updated_chart = visualizer.generate_single_chart(chart_id, filters)
        return jsonify({'chart': updated_chart})
        
    except Exception as e:
        logger.error(f"Chart update failed: {str(e)}")
        return jsonify({
            'error': str(e),
            'chart': '<div class="error-message">Failed to update chart</div>'
        }), 500 