import { PartnerSharedSnapshot } from '../types/partner-sharing';

export interface PartnerInsight {
  id: string;
  title: string;
  message: string;
  supportTip: string;
  phase: string;
  energy: 'low' | 'moderate' | 'high' | 'peak';
  color: string;
  emoji: string;
}

const MOOD_INSIGHTS: Record<string, { message: string; supportTip: string; energy: PartnerInsight['energy'] }> = {
  happy: {
    message: "She's feeling upbeat and positive today.",
    supportTip: "Great time to plan something fun together or celebrate small wins.",
    energy: 'high',
  },
  calm: {
    message: "She's feeling calm and balanced right now.",
    supportTip: "A peaceful evening together would be appreciated. Match her calm energy.",
    energy: 'moderate',
  },
  sad: {
    message: "She may be feeling down today. Emotional sensitivity could be heightened.",
    supportTip: "Be extra patient and present. A kind gesture or simply listening goes a long way.",
    energy: 'low',
  },
  anxious: {
    message: "She may be experiencing some anxiety or restlessness.",
    supportTip: "Offer reassurance without being dismissive. Help reduce any unnecessary stressors.",
    energy: 'low',
  },
  irritable: {
    message: "She may feel more easily frustrated today.",
    supportTip: "Avoid conflict triggers. Give space if needed, but stay available and supportive.",
    energy: 'moderate',
  },
  tired: {
    message: "She's feeling low on energy and may need extra rest.",
    supportTip: "Suggest rest, take over some tasks, and keep the environment calm.",
    energy: 'low',
  },
  energetic: {
    message: "She's feeling energized and motivated today!",
    supportTip: "Match her energy — plan active things together or support her goals.",
    energy: 'peak',
  },
  stressed: {
    message: "She may be under significant stress right now.",
    supportTip: "Reduce conflict triggers, offer help with tasks, and suggest relaxation together.",
    energy: 'low',
  },
  neutral: {
    message: "She's feeling steady and neutral today.",
    supportTip: "A stable day — good for routine activities and light conversation.",
    energy: 'moderate',
  },
  emotional: {
    message: "She may be experiencing heightened emotions today.",
    supportTip: "Be gentle and avoid dismissing feelings. Active listening is key.",
    energy: 'moderate',
  },
};

const DEFAULT_MOOD_INSIGHT = {
  message: "Her mood data is available. Check in and be attentive.",
  supportTip: "Simply asking 'How are you feeling?' can mean a lot.",
  energy: 'moderate' as const,
};

function getCyclePhaseInfo(snapshot: PartnerSharedSnapshot): {
  phase: string;
  phaseMessage: string;
  phaseTip: string;
  energy: PartnerInsight['energy'];
  emoji: string;
} | null {
  if (!snapshot.cyclePredictions?.nextPeriodDate) return null;

  const now = new Date();
  const nextPeriod = new Date(snapshot.cyclePredictions.nextPeriodDate);
  const daysUntilPeriod = Math.ceil((nextPeriod.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const fertileStart = snapshot.cyclePredictions.fertileWindowStart
    ? new Date(snapshot.cyclePredictions.fertileWindowStart)
    : null;
  const fertileEnd = snapshot.cyclePredictions.fertileWindowEnd
    ? new Date(snapshot.cyclePredictions.fertileWindowEnd)
    : null;

  const inFertileWindow =
    fertileStart && fertileEnd && now >= fertileStart && now <= fertileEnd;

  if (daysUntilPeriod <= 0 && daysUntilPeriod >= -7) {
    return {
      phase: 'Menstrual Phase',
      phaseMessage: "She's likely on her period. Energy and comfort levels may be lower than usual.",
      phaseTip: "Be extra considerate — offer comfort foods, warmth, and reduce demands. Pain relief support helps.",
      energy: 'low',
      emoji: '🌙',
    };
  }

  if (daysUntilPeriod > 0 && daysUntilPeriod <= 5) {
    return {
      phase: 'Pre-Menstrual (PMS Window)',
      phaseMessage: "PMS window — she may experience mood shifts, bloating, or fatigue this week.",
      phaseTip: "Reduce conflict triggers, be patient with mood changes, and suggest gentle activities.",
      energy: 'low',
      emoji: '🍂',
    };
  }

  if (inFertileWindow) {
    return {
      phase: 'Ovulation Phase',
      phaseMessage: "Ovulation phase — energy and confidence are likely at their peak.",
      phaseTip: "Great time for active plans, social events, and meaningful conversations.",
      energy: 'peak',
      emoji: '☀️',
    };
  }

  if (daysUntilPeriod > 5 && daysUntilPeriod <= 14) {
    return {
      phase: 'Luteal Phase',
      phaseMessage: "Luteal phase — energy may start to wind down as the cycle progresses.",
      phaseTip: "Supportive routines, lighter plans, and patience will be valued.",
      energy: 'moderate',
      emoji: '🌤',
    };
  }

  if (daysUntilPeriod > 14) {
    return {
      phase: 'Follicular Phase',
      phaseMessage: "Follicular phase — energy is building. She may feel more creative and motivated.",
      phaseTip: "Support new ideas and plans. It's a great window for trying new things together.",
      energy: 'high',
      emoji: '🌱',
    };
  }

  return null;
}

function getSymptomInsight(symptoms: string[]): { message: string; tip: string } | null {
  if (!symptoms || symptoms.length === 0) return null;

  const lowerSymptoms = symptoms.map((s) => s.toLowerCase());

  const hasHeadache = lowerSymptoms.some((s) => s.includes('headache'));
  const hasCramps = lowerSymptoms.some((s) => s.includes('cramp'));
  const hasFatigue = lowerSymptoms.some((s) => s.includes('fatigue') || s.includes('tired'));
  const hasBloating = lowerSymptoms.some((s) => s.includes('bloat'));
  const hasNausea = lowerSymptoms.some((s) => s.includes('nausea'));
  const hasBackPain = lowerSymptoms.some((s) => s.includes('back'));
  const hasMoodSwings = lowerSymptoms.some((s) => s.includes('mood'));

  const tips: string[] = [];
  const messages: string[] = [];

  if (hasCramps) {
    messages.push("cramps");
    tips.push("A heating pad or warm drink could help with cramps.");
  }
  if (hasHeadache) {
    messages.push("headaches");
    tips.push("Keep the environment quiet and offer hydration.");
  }
  if (hasFatigue) {
    messages.push("fatigue");
    tips.push("Encourage rest and take over some responsibilities.");
  }
  if (hasBloating) {
    messages.push("bloating");
    tips.push("Light meals and gentle movement can ease bloating.");
  }
  if (hasNausea) {
    messages.push("nausea");
    tips.push("Ginger tea or small, bland meals may help with nausea.");
  }
  if (hasBackPain) {
    messages.push("back pain");
    tips.push("A gentle back massage or warm compress could provide relief.");
  }
  if (hasMoodSwings) {
    messages.push("mood changes");
    tips.push("Be patient and avoid taking mood shifts personally.");
  }

  if (messages.length === 0) {
    return {
      message: `She's experiencing: ${symptoms.join(', ')}.`,
      tip: "Check in and ask how you can help with her symptoms.",
    };
  }

  return {
    message: `She's experiencing ${messages.join(', ')}.`,
    tip: tips.join(' '),
  };
}

function getPregnancyInsight(summary: PartnerSharedSnapshot['pregnancySummary']): PartnerInsight | null {
  if (!summary?.currentWeek) return null;

  const week = summary.currentWeek;
  let message = '';
  let tip = '';
  let energy: PartnerInsight['energy'] = 'moderate';

  if (week <= 12) {
    message = `Week ${week} — First trimester. She may experience nausea, fatigue, and emotional sensitivity.`;
    tip = "Be extra supportive with meals, rest, and emotional reassurance. Morning sickness is real.";
    energy = 'low';
  } else if (week <= 27) {
    message = `Week ${week} — Second trimester. Energy often improves, but body changes are accelerating.`;
    tip = "Great time for nesting prep, gentle activities together, and enjoying this phase.";
    energy = 'moderate';
  } else {
    message = `Week ${week} — Third trimester. Physical discomfort increases as the due date approaches.`;
    tip = "Help with physical tasks, attend appointments together, and prepare for the arrival.";
    energy = 'low';
  }

  if (summary.daysUntilDue !== undefined && summary.daysUntilDue <= 14) {
    message += ` Only ${summary.daysUntilDue} days until the due date!`;
    tip = "Stay close, keep bags packed, and be ready. Your calm presence matters most now.";
  }

  return {
    id: 'pregnancy',
    title: 'Pregnancy Update',
    message,
    supportTip: tip,
    phase: `Week ${week}`,
    energy,
    color: '#22B8A8',
    emoji: '🤰',
  };
}

export function generatePartnerInsights(snapshot: PartnerSharedSnapshot | null): PartnerInsight[] {
  if (!snapshot) return [];

  const insights: PartnerInsight[] = [];

  const cyclePhase = getCyclePhaseInfo(snapshot);
  if (cyclePhase) {
    insights.push({
      id: 'cycle_phase',
      title: cyclePhase.phase,
      message: cyclePhase.phaseMessage,
      supportTip: cyclePhase.phaseTip,
      phase: cyclePhase.phase,
      energy: cyclePhase.energy,
      color: cyclePhase.energy === 'peak' ? '#E6B84D' : cyclePhase.energy === 'high' ? '#22B8A8' : cyclePhase.energy === 'moderate' ? '#A855F7' : '#9333EA',
      emoji: cyclePhase.emoji,
    });
  }

  if (snapshot.latestMood) {
    const moodKey = snapshot.latestMood.toLowerCase();
    const moodData = MOOD_INSIGHTS[moodKey] ?? DEFAULT_MOOD_INSIGHT;
    insights.push({
      id: 'mood',
      title: `Mood: ${snapshot.latestMood}`,
      message: moodData.message,
      supportTip: moodData.supportTip,
      phase: 'Current Mood',
      energy: moodData.energy,
      color: moodData.energy === 'peak' ? '#E6B84D' : moodData.energy === 'high' ? '#22B8A8' : moodData.energy === 'moderate' ? '#A855F7' : '#9333EA',
      emoji: moodData.energy === 'low' ? '💜' : moodData.energy === 'peak' ? '✨' : '💛',
    });
  }

  if (snapshot.latestSymptoms && snapshot.latestSymptoms.length > 0) {
    const symptomData = getSymptomInsight(snapshot.latestSymptoms);
    if (symptomData) {
      insights.push({
        id: 'symptoms',
        title: 'Active Symptoms',
        message: symptomData.message,
        supportTip: symptomData.tip,
        phase: 'Symptoms',
        energy: 'low',
        color: '#9333EA',
        emoji: '🩺',
      });
    }
  }

  const pregnancyInsight = getPregnancyInsight(snapshot.pregnancySummary);
  if (pregnancyInsight) {
    insights.push(pregnancyInsight);
  }

  return insights;
}

export function getEnergyLabel(energy: PartnerInsight['energy']): string {
  switch (energy) {
    case 'low':
      return 'Low Energy';
    case 'moderate':
      return 'Moderate Energy';
    case 'high':
      return 'High Energy';
    case 'peak':
      return 'Peak Energy';
  }
}

export function getEnergyColor(energy: PartnerInsight['energy']): string {
  switch (energy) {
    case 'low':
      return '#9333EA';
    case 'moderate':
      return '#A855F7';
    case 'high':
      return '#22B8A8';
    case 'peak':
      return '#E6B84D';
  }
}
