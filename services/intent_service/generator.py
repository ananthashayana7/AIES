import os
from datetime import datetime

def generate_html_report(analysis_result, project_name="Design Analysis"):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    violations_html = ""
    if analysis_result.get("violations"):
        for v in analysis_result["violations"]:
            violations_html += f"""
            <div class="violation">
                <strong>Rule:</strong> {v.get('rule_id')}<br>
                <strong>Message:</strong> {v.get('message')}<br>
                <span class="fail">Current: {v.get('current')} | Required: {v.get('required')}</span>
            </div>
            """
    else:
        violations_html = '<p class="pass">No violations detected.</p>'

    suggestions_html = ""
    if analysis_result.get("suggested_parameter_updates"):
        for param, value in analysis_result["suggested_parameter_updates"].items():
            suggestions_html += f"<li><strong>{param}:</strong> Set to {value}</li>"
    
    html_content = f"""
    <html>
    <head>
        <title>{project_name} - AI Engineering Report</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; color: #333; }}
            h1 {{ color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px; }}
            .card {{ background: #f9f9f9; border: 1px solid #ddd; padding: 20px; margin-bottom: 20px; border-radius: 5px; }}
            .violation {{ border-left: 4px solid #e74c3c; padding-left: 10px; margin-bottom: 10px; background: #fff; padding: 10px; }}
            .pass {{ color: #27ae60; font-weight: bold; }}
            .fail {{ color: #c0392b; font-weight: bold; }}
            .score {{ font-size: 1.2em; }}
        </style>
    </head>
    <body>
        <h1>AI Engineering Analysis Report</h1>
        <p><strong>Project:</strong> {project_name}<br><strong>Date:</strong> {timestamp}</p>
        
        <div class="card">
            <h2>Executive Summary</h2>
            <p class="score">Compliance: <span class="{ 'pass' if analysis_result['compliance'] else 'fail' }">{analysis_result['compliance']}</span></p>
            <p class="score">Risk Score: {analysis_result['risk_score']}</p>
            <p><strong>AI Reasoning:</strong> {analysis_result['explanation']}</p>
        </div>

        <div class="card">
            <h2>Rule Violations</h2>
            {violations_html}
        </div>

        <div class="card">
            <h2>Optimization Suggestions</h2>
            <ul>{suggestions_html}</ul>
        </div>
    </body>
    </html>
    """
    
    # Ensure reports directory exists
    base_dir = os.path.dirname(os.path.abspath(__file__))
    reports_dir = os.path.join(base_dir, "../../reports")
    if not os.path.exists(reports_dir):
        os.makedirs(reports_dir)
        
    filename = f"Report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
    filepath = os.path.join(reports_dir, filename)
    
    with open(filepath, "w") as f:
        f.write(html_content)
        
    return filepath