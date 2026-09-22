import { generateRichDummyData } from './mock-data';

interface PdfGeneratorParams {
  cycles: any[];
  predictions: any;
  insights: any[];
  healthAnalysis: any;
  dummyData: ReturnType<typeof generateRichDummyData> | null;
}

const PDF_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
:root{--primary:#E85D8C;--primary-light:#FDF2F6;--primary-dark:#C74B7A;--secondary:#6B8E9B;--secondary-light:#E8F4F8;--accent:#E8A87C;--accent-light:#FEF5EE;--success:#6BAF92;--success-light:#E8F5EE;--warning:#E8C87C;--warning-light:#FEF9EE;--text-primary:#2D3748;--text-secondary:#5A6778;--text-muted:#8A95A5;--bg-light:#FAFBFC;--bg-card:#FFF;--border:#E8ECF1;--shadow:rgba(45,55,72,0.08)}
@page{size:A4;margin:100px 48px 80px 48px}
@page :first{margin-top:0;margin-bottom:0}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',-apple-system,sans-serif;background:var(--bg-light);color:var(--text-primary);line-height:1.7;font-size:14px}
.cover-page{min-height:100vh;background:linear-gradient(145deg,var(--primary-light) 0%,#FFF 50%,var(--secondary-light) 100%);display:flex;flex-direction:column;justify-content:center;align-items:center;padding:60px;text-align:center;page-break-after:always}
.cover-logo{width:80px;height:80px;background:linear-gradient(135deg,var(--primary),var(--primary-dark));border-radius:20px;display:flex;align-items:center;justify-content:center;margin-bottom:32px;box-shadow:0 12px 40px rgba(232,93,140,0.3)}
.cover-logo span{font-size:40px}
.cover-title{font-size:42px;font-weight:700;color:var(--text-primary);margin-bottom:8px}
.cover-subtitle{font-size:18px;color:var(--primary);font-weight:500;margin-bottom:48px}
.cover-meta{background:var(--bg-card);border-radius:16px;padding:32px 48px;box-shadow:0 4px 20px var(--shadow);border:1px solid var(--border)}
.cover-meta h2{font-size:24px;font-weight:600;margin-bottom:4px}
.cover-meta p{color:var(--text-secondary);font-size:15px}
.cover-badge{display:inline-block;background:linear-gradient(135deg,var(--primary),var(--accent));color:white;padding:8px 20px;border-radius:20px;font-size:13px;font-weight:600;margin-top:24px}
.cover-footer{margin-top:auto;padding-top:48px;color:var(--text-muted);font-size:12px}
.content-wrapper{padding:48px;max-width:900px;margin:0 auto}
.page-header{text-align:center;margin-bottom:40px;padding-bottom:24px;border-bottom:2px solid var(--border)}
.page-header h1{color:var(--primary);font-size:28px;font-weight:700;margin-bottom:4px}
.page-header p{color:var(--text-muted);font-size:14px}
.executive-summary{background:linear-gradient(135deg,var(--bg-card),var(--primary-light));border-radius:20px;padding:32px;margin-bottom:40px;border:1px solid var(--border);box-shadow:0 4px 20px var(--shadow)}
.executive-summary h2{font-size:22px;font-weight:700;margin-bottom:24px;border-bottom:none;padding-bottom:0}
.summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px}
.summary-item{background:var(--bg-card);border-radius:16px;padding:20px;text-align:center;border:1px solid var(--border)}
.summary-icon{font-size:28px;margin-bottom:8px}
.summary-value{font-size:32px;font-weight:700;color:var(--primary);line-height:1.2}
.summary-label{font-size:12px;color:var(--text-muted);font-weight:500;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px}
.summary-highlights{background:var(--bg-card);border-radius:12px;padding:20px 24px;border:1px solid var(--border)}
.summary-highlights h3{font-size:15px;font-weight:600;margin-bottom:16px}
.summary-highlights ul{list-style:none;padding:0;margin:0}
.summary-highlights li{display:flex;align-items:center;gap:12px;padding:8px 0;font-size:14px;color:var(--text-secondary);border-bottom:1px solid var(--border)}
.summary-highlights li:last-child{border-bottom:none}
.highlight-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.highlight-dot.good{background:var(--success)}.highlight-dot.moderate{background:var(--warning)}.highlight-dot.info{background:var(--secondary)}
.section{background:var(--bg-card);border-radius:20px;padding:32px;margin-bottom:24px;border:1px solid var(--border);box-shadow:0 2px 12px var(--shadow);page-break-inside:avoid}
h2{font-size:20px;font-weight:700;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid var(--border)}
h3{font-size:16px;font-weight:600;margin:24px 0 16px}
h4{font-size:14px;font-weight:600;color:var(--text-secondary);margin:16px 0 12px}
.cycle-card{background:var(--bg-light);border-radius:16px;padding:20px;margin-bottom:16px;border:1px solid var(--border);border-left:4px solid var(--primary);page-break-inside:avoid}
.cycle-card h3{color:var(--primary);font-size:16px;margin-bottom:16px}
.cycle-card p{margin-bottom:8px;font-size:13px;color:var(--text-secondary)}
.cycle-card p strong{color:var(--text-primary)}
.day-entry{display:flex;flex-wrap:wrap;gap:16px;padding:12px 0;border-bottom:1px solid var(--border);font-size:12px}
.day-entry:last-child{border-bottom:none}
.day-entry .date{font-weight:600;color:var(--text-primary);min-width:90px;font-size:13px}
.day-entry .mood{background:var(--accent-light);color:var(--accent);padding:4px 10px;border-radius:12px;font-weight:500}
.day-entry .flow{background:var(--primary-light);color:var(--primary);padding:4px 10px;border-radius:12px;font-weight:500}
.day-entry .symptoms{color:var(--text-secondary);font-size:12px}
.day-entry .lifestyle{background:var(--secondary-light);color:var(--secondary);padding:4px 10px;border-radius:12px;font-size:11px}
.predictions-section{margin-top:32px}
.prediction-card{background:linear-gradient(135deg,var(--primary-light),var(--accent-light));border-radius:16px;padding:24px;border:1px solid rgba(232,93,140,0.2);page-break-inside:avoid}
.prediction-card p{margin-bottom:12px;font-size:14px;color:var(--text-secondary)}
.prediction-card p strong{color:var(--text-primary)}
.analytics-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px}
.analytics-card{background:linear-gradient(145deg,var(--bg-card),var(--secondary-light));border-radius:16px;padding:20px 16px;text-align:center;border:1px solid var(--border);page-break-inside:avoid}
.analytics-value{font-size:32px;font-weight:700;color:var(--secondary);line-height:1.2}
.analytics-label{font-size:11px;color:var(--text-muted);margin-top:6px;font-weight:500;text-transform:uppercase}
.symptom-list{margin-bottom:28px}
.symptom-item{display:flex;align-items:center;margin-bottom:12px;gap:16px}
.symptom-name{width:130px;font-size:13px;font-weight:500;text-transform:capitalize;color:var(--text-secondary)}
.symptom-bar-container{flex:1;background:var(--border);border-radius:6px;height:10px;overflow:hidden}
.symptom-bar{height:100%;background:linear-gradient(90deg,var(--primary),var(--accent));border-radius:6px}
.symptom-percent{width:50px;text-align:right;font-size:13px;font-weight:600;color:var(--text-primary)}
.mood-table{width:100%;border-collapse:separate;border-spacing:0;margin-bottom:28px;border-radius:12px;overflow:hidden;border:1px solid var(--border)}
.mood-table th,.mood-table td{padding:14px 16px;text-align:left;border-bottom:1px solid var(--border);font-size:13px}
.mood-table th{background:var(--bg-light);font-weight:600;font-size:12px;text-transform:uppercase}
.mood-table td{text-transform:capitalize;color:var(--text-secondary)}
.trends-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.trend-card{padding:20px;border-radius:14px;page-break-inside:avoid}
.trend-card h4{font-size:13px;font-weight:600;margin-bottom:10px}
.trend-card p{font-size:13px;text-transform:capitalize;line-height:1.5}
.trend-card.improving{background:var(--success-light);border:1px solid rgba(107,175,146,0.3)}
.trend-card.improving h4{color:#166534}.trend-card.improving p{color:#15803D}
.trend-card.stable{background:var(--warning-light);border:1px solid rgba(232,200,124,0.3)}
.trend-card.stable h4{color:#92400E}.trend-card.stable p{color:#A16207}
.trend-card.attention{background:#F5F0FF;border:1px solid rgba(147,51,234,0.2)}
.trend-card.attention h4{color:#7E22CE}.trend-card.attention p{color:#6B21A8}
.insight-card{padding:20px;border-radius:14px;margin-bottom:14px;background:var(--bg-light);border:1px solid var(--border);border-left:4px solid var(--primary);page-break-inside:avoid}
.insight-card.health{border-left-color:var(--success);background:linear-gradient(135deg,var(--bg-card),var(--success-light))}
.insight-card.tip{border-left-color:var(--accent);background:linear-gradient(135deg,var(--bg-card),var(--accent-light))}
.insight-type{font-size:10px;font-weight:700;color:var(--primary);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px}
.insight-card.health .insight-type{color:var(--success)}
.insight-card.tip .insight-type{color:var(--accent)}
.insight-card h4{font-size:15px;font-weight:600;margin-bottom:8px}
.insight-card p{font-size:13px;color:var(--text-secondary);line-height:1.6}
.insight-date{font-size:11px;color:var(--text-muted);display:block;margin-top:10px}
.health-card{background:linear-gradient(145deg,var(--bg-card),var(--bg-light));border-radius:14px;padding:20px;margin-bottom:16px;border:1px solid var(--border);page-break-inside:avoid}
.health-card h3{margin:0 0 10px;font-size:15px}
.health-card p{font-size:13px;color:var(--text-secondary);line-height:1.7;margin:0}
.footer{margin-top:48px;padding:32px;background:var(--bg-light);border-radius:16px;text-align:center;border:1px solid var(--border)}
.footer p{color:var(--text-muted);font-size:12px;margin-bottom:4px}
.footer p:first-child{color:var(--primary);font-weight:600;font-size:14px;margin-bottom:8px}
.disclaimer{background:linear-gradient(135deg,var(--warning-light),#FFFBEB);border-radius:14px;padding:20px 24px;margin-top:32px;font-size:13px;color:#92400E;border:1px solid rgba(232,200,124,0.3);line-height:1.6}
.disclaimer strong{display:block;margin-bottom:8px;font-size:14px}
.final-page-footer{page-break-before:always;margin-top:40px;padding:40px;background:linear-gradient(145deg,var(--primary-light),var(--bg-card) 50%,var(--secondary-light));border-radius:20px;text-align:center;border:1px solid var(--border)}
.final-logo{width:64px;height:64px;background:linear-gradient(135deg,var(--primary),var(--primary-dark));border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;box-shadow:0 8px 24px rgba(232,93,140,0.25)}
.final-logo span{font-size:32px}
.final-title{font-size:24px;font-weight:700;color:var(--primary);margin-bottom:8px}
.final-subtitle{font-size:16px;color:var(--text-secondary);margin-bottom:32px;font-weight:500}
.ai-disclaimer{background:var(--warning-light);border:1px solid rgba(232,200,124,0.4);border-radius:12px;padding:20px 24px;margin-bottom:24px;text-align:left}
.ai-disclaimer-header{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.ai-disclaimer-icon{font-size:20px}
.ai-disclaimer-title{font-size:14px;font-weight:600;color:#92400E}
.ai-disclaimer-text{font-size:12px;color:#78350F;line-height:1.7}
.ai-disclaimer-text strong{color:#92400E}
.confidentiality-notice{background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:20px 24px;margin-bottom:24px}
.confidentiality-title{font-size:13px;font-weight:600;margin-bottom:8px}
.confidentiality-text{font-size:12px;color:var(--text-secondary);line-height:1.6}
.contact-section{padding-top:24px;border-top:1px solid var(--border)}
.contact-title{font-size:12px;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px}
.contact-email{font-size:16px;font-weight:600;color:var(--primary)}
.report-id{margin-top:24px;font-size:10px;color:var(--text-muted)}
.running-header{position:running(page-header);width:100%;padding:16px 0;border-bottom:2px solid var(--primary-light);display:flex;justify-content:space-between;align-items:center;background:white}
.running-header-left{display:flex;align-items:center;gap:12px}
.running-header-logo{width:32px;height:32px;background:linear-gradient(135deg,var(--primary),var(--primary-dark));border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px}
.running-header-title{font-size:14px;font-weight:600;color:var(--primary)}
.running-header-right{font-size:11px;color:var(--text-muted);text-align:right}
.running-footer{position:running(page-footer);width:100%;padding:12px 0;border-top:1px solid var(--border);display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted);background:white}
.running-footer-center{color:var(--primary);font-weight:500}
@media print{body{background:white;padding:0}.section{box-shadow:none;border:1px solid #E5E7EB}table,tr{page-break-inside:avoid}h2,h3,h4{page-break-after:avoid}p{orphans:3;widows:3}.final-page-footer{page-break-before:always}}
`;

function buildCyclesSummary(exportCycles: any[]): string {
  if (!exportCycles || exportCycles.length === 0) return '';
  let html = '';
  exportCycles.forEach((cycle, index) => {
    const startDate = new Date(cycle.startDate).toLocaleDateString();
    const endDate = cycle.endDate ? new Date(cycle.endDate).toLocaleDateString() : 'Ongoing';
    html += `<div class="cycle-card"><h3>Cycle ${index + 1}</h3><p><strong>Start:</strong> ${startDate}</p><p><strong>End:</strong> ${endDate}</p><p><strong>Length:</strong> ${cycle.length || 'N/A'} days</p>`;
    if (cycle.days && cycle.days.length > 0) {
      html += `<div style="margin-top:16px;padding-top:16px;border-top:1px dashed var(--border)"><h4>Daily Logs (${cycle.days.length} entries)</h4>`;
      cycle.days.slice(0, 10).forEach((day: any) => {
        html += `<div class="day-entry"><span class="date">${new Date(day.date).toLocaleDateString()}</span>`;
        if (day.mood) html += `<span class="mood">Mood: ${day.mood}</span>`;
        if (day.flow) html += `<span class="flow">Flow: ${day.flow}</span>`;
        if (day.symptoms?.length) html += `<span class="symptoms">Symptoms: ${day.symptoms.join(', ')}</span>`;
        if (day.sleep) html += `<span class="lifestyle">Sleep: ${day.sleep}h</span>`;
        if (day.exercise) html += `<span class="lifestyle">Exercise: ${day.exercise}min</span>`;
        if (day.waterIntake) html += `<span class="lifestyle">Water: ${day.waterIntake} glasses</span>`;
        html += `</div>`;
      });
      if (cycle.days.length > 10) html += `<p style="font-style:italic;color:var(--text-muted);margin-top:12px;font-size:12px">... and ${cycle.days.length - 10} more entries</p>`;
      html += `</div>`;
    }
    html += `</div>`;
  });
  return html;
}

function buildExecutiveSummary(analytics: any, predictions: any): string {
  return `<div class="executive-summary"><h2>Executive Summary</h2>
    <div class="summary-grid">
      <div class="summary-item"><div class="summary-icon">📊</div><div><div class="summary-value">${analytics?.averageCycleLength || 28}</div><div class="summary-label">Day Avg Cycle</div></div></div>
      <div class="summary-item"><div class="summary-icon">✨</div><div><div class="summary-value">${analytics?.cycleRegularity || 85}%</div><div class="summary-label">Regularity Score</div></div></div>
      <div class="summary-item"><div class="summary-icon">😊</div><div><div class="summary-value">${analytics?.moodWellnessAnalytics?.overallMoodScore || 68}</div><div class="summary-label">Mood Score</div></div></div>
      <div class="summary-item"><div class="summary-icon">📈</div><div><div class="summary-value">${analytics?.trackingConsistency || 90}%</div><div class="summary-label">Tracking Rate</div></div></div>
    </div>
    <div class="summary-highlights"><h3>Key Highlights</h3><ul>
      <li><span class="highlight-dot good"></span>Cycle regularity: ${analytics?.cycleRegularity || 85}%</li>
      <li><span class="highlight-dot ${(analytics?.moodWellnessAnalytics?.overallMoodScore || 68) >= 70 ? 'good' : 'moderate'}"></span>Overall mood trending ${(analytics?.moodWellnessAnalytics?.overallMoodScore || 68) >= 70 ? 'positively' : 'stable'}</li>
      <li><span class="highlight-dot info"></span>Most common symptom: ${analytics?.mostCommonSymptoms?.[0]?.symptom?.replace('_', ' ') || 'cramps'}</li>
      <li><span class="highlight-dot good"></span>Next predicted period: ${predictions?.nextPeriodDate ? new Date(predictions.nextPeriodDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}</li>
    </ul></div></div>`;
}

function buildAnalyticsHtml(analytics: any): string {
  if (!analytics) return '';
  let html = `<div class="section"><h2>📊 Cycle Analytics</h2>
    <div class="analytics-grid">
      <div class="analytics-card"><div class="analytics-value">${analytics.averageCycleLength}</div><div class="analytics-label">Avg Cycle Length</div></div>
      <div class="analytics-card"><div class="analytics-value">${analytics.averagePeriodLength}</div><div class="analytics-label">Avg Period Length</div></div>
      <div class="analytics-card"><div class="analytics-value">${analytics.cycleRegularity}%</div><div class="analytics-label">Cycle Regularity</div></div>
      <div class="analytics-card"><div class="analytics-value">${analytics.trackingConsistency}%</div><div class="analytics-label">Tracking Consistency</div></div>
    </div>
    <h3>Top Symptoms</h3><div class="symptom-list">${analytics.mostCommonSymptoms.map((s: any) => `
      <div class="symptom-item"><span class="symptom-name">${s.symptom.replace('_', ' ')}</span><div class="symptom-bar-container"><div class="symptom-bar" style="width:${s.frequency}%"></div></div><span class="symptom-percent">${s.frequency}%</span></div>
    `).join('')}</div>
    <h3>Mood Patterns by Phase</h3>
    <table class="mood-table"><tr><th>Phase</th><th>Dominant Mood</th><th>Avg Intensity</th></tr>
    ${analytics.moodPatterns.map((m: any) => `<tr><td>${m.phase}</td><td>${m.dominantMood}</td><td>${m.avgIntensity}/5</td></tr>`).join('')}</table>
    <h3>Symptom Trends</h3><div class="trends-grid">
      <div class="trend-card improving"><h4>✓ Improving</h4><p>${analytics.symptomTrends.improving.join(', ')}</p></div>
      <div class="trend-card stable"><h4>● Stable</h4><p>${analytics.symptomTrends.stable.join(', ')}</p></div>
      <div class="trend-card attention"><h4>! Needs Attention</h4><p>${analytics.symptomTrends.needsAttention.join(', ')}</p></div>
    </div>`;

  if (analytics.lifestyleMetrics) {
    html += `<h3>Lifestyle Metrics</h3><div class="analytics-grid">
      <div class="analytics-card"><div class="analytics-value">${analytics.lifestyleMetrics.avgSleepHours}</div><div class="analytics-label">Avg Sleep (hours)</div></div>
      <div class="analytics-card"><div class="analytics-value">${analytics.lifestyleMetrics.avgExerciseMinutes}</div><div class="analytics-label">Avg Exercise (min)</div></div>
      <div class="analytics-card"><div class="analytics-value">${analytics.lifestyleMetrics.avgWaterIntake}</div><div class="analytics-label">Avg Water (glasses)</div></div>
      <div class="analytics-card"><div class="analytics-value">${analytics.lifestyleMetrics.avgTemperature}°F</div><div class="analytics-label">Avg BBT</div></div>
    </div>`;
  }
  html += `</div>`;
  return html;
}

function buildInsightsHtml(exportInsights: any[]): string {
  if (!exportInsights || exportInsights.length === 0) return '';
  return `<div class="section"><h2>💡 AI-Powered Insights</h2>${exportInsights.map(insight => `
    <div class="insight-card ${insight.type}"><div class="insight-type">${insight.type.toUpperCase()}</div><h4>${insight.title}</h4><p>${insight.description}</p><span class="insight-date">${new Date(insight.date).toLocaleDateString()}</span></div>
  `).join('')}</div>`;
}

function buildHealthAnalysisHtml(ha: any): string {
  if (!ha) return '';
  const fields = ['cycleSummary', 'hormonalBalance', 'potentialConcerns', 'nutritionalRecommendations', 'lifestyleRecommendations', 'stressManagement', 'fertilityInsights'];
  const labels: Record<string, string> = { cycleSummary: 'Cycle Summary', hormonalBalance: 'Hormonal Balance', potentialConcerns: 'Potential Concerns', nutritionalRecommendations: 'Nutritional Recommendations', lifestyleRecommendations: 'Lifestyle Recommendations', stressManagement: 'Stress Management', fertilityInsights: 'Fertility Insights' };
  return `<div class="section"><h2>🏥 Health Analysis</h2>${fields.map(f => `<div class="health-card"><h3>${labels[f]}</h3><p>${ha[f]}</p></div>`).join('')}</div>`;
}

function buildPredictionsHtml(predictions: any): string {
  if (!predictions) return '';
  let html = `<div class="predictions-section"><h2>🔮 Current Predictions</h2><div class="prediction-card">`;
  if (predictions.nextPeriodDate) html += `<p><strong>Next Period:</strong> ${new Date(predictions.nextPeriodDate).toLocaleDateString()}</p>`;
  if (predictions.fertileWindowStart) html += `<p><strong>Fertile Window:</strong> ${new Date(predictions.fertileWindowStart).toLocaleDateString()} - ${predictions.fertileWindowEnd ? new Date(predictions.fertileWindowEnd).toLocaleDateString() : 'N/A'}</p>`;
  if (predictions.averageCycleLength) html += `<p><strong>Average Cycle Length:</strong> ${predictions.averageCycleLength} days</p>`;
  if (predictions.confidence) html += `<p><strong>Prediction Confidence:</strong> ${Math.round(predictions.confidence * 100)}%</p>`;
  html += `</div></div>`;
  return html;
}

export function generatePdfHtml(params: PdfGeneratorParams, hasDummyData: boolean): string {
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const reportMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const exportCycles = params.dummyData?.cycles || params.cycles;
  const exportPredictions = params.dummyData?.predictions || params.predictions;
  const exportInsights = params.dummyData?.insights || params.insights;
  const exportHealthAnalysis = params.dummyData?.healthAnalysis || params.healthAnalysis;
  const exportAnalytics = params.dummyData?.analytics || null;

  const executiveSummaryHtml = buildExecutiveSummary(exportAnalytics, exportPredictions);
  const cyclesSummary = buildCyclesSummary(exportCycles);
  const analyticsHtml = buildAnalyticsHtml(exportAnalytics);
  const insightsHtml = buildInsightsHtml(exportInsights);
  const healthAnalysisHtml = buildHealthAnalysisHtml(exportHealthAnalysis);
  const predictionsHtml = buildPredictionsHtml(exportPredictions);

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>F365 Health Report</title><style>${PDF_CSS}</style></head><body>
    <div class="cover-page"><div class="cover-logo"><span>🌸</span></div><h1 class="cover-title">F365</h1><p class="cover-subtitle">Personal Health & Wellness Report</p>
      <div class="cover-meta"><h2>${reportMonth}</h2><p>Comprehensive Cycle Analysis & Insights</p>${hasDummyData ? '<span class="cover-badge">Demo Report</span>' : ''}</div>
      <div class="cover-footer"><p>Generated on ${currentDate}</p><p>This report is confidential and for personal use only</p></div></div>
    <div class="content-wrapper">
      <div class="page-header"><h1>F365 Health Report</h1><p>${reportMonth} • Generated ${currentDate}</p></div>
      ${executiveSummaryHtml}${analyticsHtml}${insightsHtml}${healthAnalysisHtml}${predictionsHtml}
      <div class="section"><h2>📅 Cycle History</h2>${cyclesSummary || '<p style="color:var(--text-muted);font-style:italic">No cycle data recorded yet.</p>'}</div>
      <div class="disclaimer"><strong>⚠️ Medical Disclaimer</strong>This report is for personal reference only. Always consult a qualified healthcare professional for medical concerns. Contact us at hello@f365.app for support.</div>
      <div class="footer"><p>F365 — Your Personal Wellness Companion</p><p>This data is private and confidential</p><p>Questions? hello@f365.app</p></div>
      <div class="final-page-footer"><div class="final-logo"><span>🌸</span></div><h2 class="final-title">F365</h2><p class="final-subtitle">Your Personal Wellness Companion</p>
        <div class="ai-disclaimer"><div class="ai-disclaimer-header"><span class="ai-disclaimer-icon">🤖</span><span class="ai-disclaimer-title">AI-Generated Report Notice</span></div>
          <p class="ai-disclaimer-text"><strong>Important:</strong> This report was generated using AI and automated analysis. It is not reviewed by healthcare professionals. Use for personal tracking only — not for clinical diagnosis or treatment decisions.</p></div>
        <div class="confidentiality-notice"><p class="confidentiality-title">Confidentiality Statement</p><p class="confidentiality-text">This document contains sensitive personal health information. Unauthorized distribution is prohibited.</p></div>
        <div class="contact-section"><p class="contact-title">Questions or Support</p><p class="contact-email">hello@f365.app</p></div>
        <p class="report-id">Report ID: ${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}<br>Generated: ${currentDate} | Version 2.0</p></div>
    </div>
    <div class="running-header"><div class="running-header-left"><div class="running-header-logo">🌸</div><span class="running-header-title">F365 Health Report</span></div><div class="running-header-right">${reportMonth}<br>Confidential</div></div>
    <div class="running-footer"><span>Private & Confidential</span><span class="running-footer-center">F365 — Your Personal Wellness Companion</span><span>hello@f365.app</span></div>
  </body></html>`;
}
