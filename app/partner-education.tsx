import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  BookOpen,
  Brain,
  Heart,
  Zap,
  Moon,
  TrendingUp,
  ChevronDown,
  Shield,
  Sparkles,
  CheckCircle,
  Baby,
  Stethoscope,
  HandHeart,
  Flower2,
} from 'lucide-react-native';
import Colors from '../constants/colors';
import { useEducationProgressStore } from '../store/education-progress-store';

const _SCREEN_WIDTH = Dimensions.get('window').width;

interface EducationTopic {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accentColor: string;
  cards: EducationCard[];
}

interface EducationCard {
  id: string;
  heading: string;
  body: string;
  keyTakeaway: string;
  emoji: string;
}

const EDUCATION_TOPICS: EducationTopic[] = [
  {
    id: 'pms',
    category: 'Hormones',
    title: 'What PMS Actually Means',
    subtitle: 'Beyond the stereotype — the real science',
    icon: <Moon size={20} color={Colors.secondary} />,
    accentColor: Colors.secondary,
    cards: [
      {
        id: 'pms_1',
        heading: 'PMS Is Real Biology',
        body: 'Premenstrual Syndrome affects up to 75% of women. It\'s caused by fluctuating levels of estrogen and progesterone in the 1–2 weeks before a period. These hormones influence serotonin (the "feel-good" brain chemical), which is why mood changes happen.',
        keyTakeaway: 'PMS is not "being dramatic" — it\'s a measurable hormonal shift affecting brain chemistry.',
        emoji: '🧬',
      },
      {
        id: 'pms_2',
        heading: 'Common PMS Symptoms',
        body: 'Physical: bloating, breast tenderness, headaches, fatigue, cramps. Emotional: irritability, anxiety, sadness, difficulty concentrating, food cravings. These vary widely between individuals and even cycle to cycle.',
        keyTakeaway: 'Every person experiences PMS differently. Don\'t assume — ask.',
        emoji: '📋',
      },
      {
        id: 'pms_3',
        heading: 'How You Can Help During PMS',
        body: 'Reduce unnecessary conflict or stressful decisions. Offer comfort without being asked (warm drinks, taking over chores). Validate feelings without trying to "fix" them. Don\'t attribute emotions to PMS unless she brings it up first.',
        keyTakeaway: 'The best support is presence, patience, and practical help.',
        emoji: '💛',
      },
    ],
  },
  {
    id: 'hormones',
    category: 'Hormones',
    title: 'Hormonal Fluctuations Explained',
    subtitle: 'The four phases of the menstrual cycle',
    icon: <TrendingUp size={20} color={Colors.accent} />,
    accentColor: Colors.accent,
    cards: [
      {
        id: 'hormones_1',
        heading: 'Menstrual Phase (Days 1–5)',
        body: 'Both estrogen and progesterone are at their lowest. Energy drops, and the body is shedding the uterine lining. Many feel tired, crampy, and prefer quiet time. Iron levels may dip, causing extra fatigue.',
        keyTakeaway: 'Low hormone levels = low energy. Comfort and rest are priorities.',
        emoji: '🌙',
      },
      {
        id: 'hormones_2',
        heading: 'Follicular Phase (Days 6–13)',
        body: 'Estrogen starts rising steadily. Energy, creativity, and optimism increase. The brain produces more serotonin and dopamine. This is often when she feels most like "herself" — motivated and social.',
        keyTakeaway: 'Rising estrogen = rising energy. Great time for plans and activities together.',
        emoji: '🌱',
      },
      {
        id: 'hormones_3',
        heading: 'Ovulation (Day ~14)',
        body: 'Estrogen peaks, triggering a surge of luteinizing hormone (LH). Energy, confidence, and libido are typically at their highest. Communication skills and social desire often peak too.',
        keyTakeaway: 'Peak hormones = peak energy and connection. Best window for important conversations.',
        emoji: '☀️',
      },
      {
        id: 'hormones_4',
        heading: 'Luteal Phase (Days 15–28)',
        body: 'Progesterone rises while estrogen falls. The body prepares for potential pregnancy. Energy gradually declines, and PMS symptoms may begin in the second half. Serotonin drops, which can cause mood shifts.',
        keyTakeaway: 'Falling hormones = winding down. Patience and reduced expectations help.',
        emoji: '🍂',
      },
    ],
  },
  {
    id: 'libido',
    category: 'Intimacy',
    title: 'Libido Patterns Through the Cycle',
    subtitle: 'Understanding natural desire fluctuations',
    icon: <Heart size={20} color={Colors.error} />,
    accentColor: Colors.error,
    cards: [
      {
        id: 'libido_1',
        heading: 'Desire Is Cyclical, Not Constant',
        body: 'Libido is directly influenced by hormonal levels. It\'s completely normal for desire to fluctuate throughout the month. This isn\'t about attraction to a partner — it\'s biology. Testosterone (yes, women have it too) peaks around ovulation.',
        keyTakeaway: 'Fluctuating desire is normal and not a reflection of your relationship.',
        emoji: '📊',
      },
      {
        id: 'libido_2',
        heading: 'When Desire Typically Peaks',
        body: 'Around ovulation (mid-cycle): estrogen and testosterone peak, increasing desire and arousal. The follicular phase also tends to bring higher interest as energy builds. Some experience increased desire just before their period too.',
        keyTakeaway: 'Mid-cycle is typically the peak. But every person has their own pattern.',
        emoji: '🔥',
      },
      {
        id: 'libido_3',
        heading: 'When Desire Typically Dips',
        body: 'During menstruation: low hormones and physical discomfort reduce desire for many (but not all). Late luteal phase: PMS symptoms, bloating, and mood shifts can lower interest. Stress, fatigue, and poor sleep amplify these dips.',
        keyTakeaway: 'Low desire ≠ low attraction. Don\'t take it personally.',
        emoji: '💤',
      },
      {
        id: 'libido_4',
        heading: 'How to Navigate This Together',
        body: 'Communicate openly about needs without pressure. Physical intimacy doesn\'t always mean sex — touch, closeness, and affection matter. Respect boundaries, especially during low-energy phases. Ask, don\'t assume.',
        keyTakeaway: 'Emotional connection supports physical intimacy. Lead with empathy.',
        emoji: '🤝',
      },
    ],
  },
  {
    id: 'energy',
    category: 'Wellbeing',
    title: 'Energy & Mood Through the Month',
    subtitle: 'Why "good days" and "bad days" have patterns',
    icon: <Zap size={20} color={Colors.gold} />,
    accentColor: Colors.gold,
    cards: [
      {
        id: 'energy_1',
        heading: 'Energy Is Not Random',
        body: 'Energy levels follow hormonal patterns. The same person can feel unstoppable one week and exhausted the next — and both are completely normal. Understanding these patterns helps avoid misunderstandings about motivation or mood.',
        keyTakeaway: 'Energy follows hormones. Planning around the cycle leads to better outcomes.',
        emoji: '⚡',
      },
      {
        id: 'energy_2',
        heading: 'The Energy Curve',
        body: 'Week 1 (Period): Low energy, need for rest. Week 2 (Follicular): Energy building, motivation rising. Week 3 (Post-ovulation): Moderate but declining energy. Week 4 (Pre-period): Lowest energy, PMS possible.',
        keyTakeaway: 'Schedule demanding activities for weeks 2–3, and protect rest in weeks 1 and 4.',
        emoji: '📈',
      },
      {
        id: 'energy_3',
        heading: 'Mood Is Hormone-Linked Too',
        body: 'Serotonin levels fluctuate with estrogen. When estrogen drops (before period), serotonin drops too — leading to sadness, anxiety, or irritability. This isn\'t weakness; it\'s neurochemistry. Some people are more sensitive to these shifts than others.',
        keyTakeaway: 'Mood changes are biochemical. Compassion, not criticism, is the right response.',
        emoji: '🧠',
      },
    ],
  },
  {
    id: 'fertility',
    category: 'Reproduction',
    title: 'Fertility Windows Explained',
    subtitle: 'The science of conception timing',
    icon: <Sparkles size={20} color={Colors.primary} />,
    accentColor: Colors.primary,
    cards: [
      {
        id: 'fertility_1',
        heading: 'The Fertile Window',
        body: 'A woman is fertile for approximately 6 days per cycle: the 5 days before ovulation and the day of ovulation itself. Sperm can survive up to 5 days in the reproductive tract, but the egg only lives 12–24 hours after release.',
        keyTakeaway: 'The fertile window is short — about 6 days per month.',
        emoji: '🎯',
      },
      {
        id: 'fertility_2',
        heading: 'Signs of Ovulation',
        body: 'Cervical mucus becomes clear and stretchy (like egg whites). Basal body temperature rises slightly after ovulation. Some experience mild pelvic pain (mittelschmerz). Libido often increases naturally.',
        keyTakeaway: 'The body gives signals. Tracking helps identify patterns over time.',
        emoji: '🔍',
      },
      {
        id: 'fertility_3',
        heading: 'What Affects Fertility',
        body: 'Stress, sleep, nutrition, weight, and age all affect cycle regularity and fertility. Irregular cycles can make prediction harder. Both partners\' health matters — it\'s not just about the woman\'s body.',
        keyTakeaway: 'Fertility is a shared journey. Both partners\' wellness matters.',
        emoji: '🌿',
      },
    ],
  },
  {
    id: 'support',
    category: 'Relationship',
    title: 'Being a Supportive Partner',
    subtitle: 'Practical ways to show up',
    icon: <Shield size={20} color={Colors.success} />,
    accentColor: Colors.success,
    cards: [
      {
        id: 'support_1',
        heading: 'Listen Before You Solve',
        body: 'When she shares how she\'s feeling, the instinct to "fix it" can backfire. Often, what\'s needed is acknowledgment, not solutions. Saying "That sounds tough, I\'m here" is more powerful than "Have you tried..."',
        keyTakeaway: 'Presence > problem-solving. Ask "Do you want advice or support?"',
        emoji: '👂',
      },
      {
        id: 'support_2',
        heading: 'Track the Cycle Together',
        body: 'You don\'t need to memorize dates, but being generally aware of where she is in her cycle shows care. This app helps you stay informed without her needing to explain every time she\'s tired or emotional.',
        keyTakeaway: 'Awareness without micromanaging. Know the patterns, respect the person.',
        emoji: '📱',
      },
      {
        id: 'support_3',
        heading: 'Small Actions, Big Impact',
        body: 'Bring her a heating pad without being asked. Take over cooking on tough days. Send a kind message during PMS week. Don\'t schedule high-stress events during her low-energy phase. These small acts build deep trust.',
        keyTakeaway: 'Anticipating needs shows you\'re paying attention and you care.',
        emoji: '✨',
      },
    ],
  },
  {
    id: 'pregnancy_first_trimester',
    category: 'Pregnancy',
    title: 'First Trimester as a Partner',
    subtitle: 'Weeks 1–13: What to expect and how to help',
    icon: <Baby size={20} color="#EC4899" />,
    accentColor: '#EC4899',
    cards: [
      {
        id: 'preg1_1',
        heading: 'She May Feel Terrible (and Look Fine)',
        body: 'The first trimester is often the hardest physically — extreme fatigue, nausea, food aversions, and hormonal surges. But she may not "look" pregnant yet. Don\'t underestimate what she\'s going through just because there\'s no visible bump.',
        keyTakeaway: 'Invisible symptoms are real symptoms. Validate without needing to see proof.',
        emoji: '🤢',
      },
      {
        id: 'preg1_2',
        heading: 'Morning Sickness Is All-Day Sickness',
        body: 'Despite the name, nausea can hit any time — morning, afternoon, or night. It\'s caused by rising hCG and estrogen levels. Triggers vary: smells, certain foods, even brushing teeth. It usually eases by week 12–14.',
        keyTakeaway: 'Keep bland snacks available. Don\'t cook strong-smelling food without asking first.',
        emoji: '😵',
      },
      {
        id: 'preg1_3',
        heading: 'Emotional Rollercoaster Is Normal',
        body: 'Hormones surge dramatically in the first trimester. She might cry at a commercial, snap over nothing, or feel inexplicably anxious. This isn\'t about you — it\'s biochemistry. Your job: be steady, patient, and present.',
        keyTakeaway: 'Don\'t try to fix emotions. Just be there. "I\'m here for you" goes a long way.',
        emoji: '🎭',
      },
      {
        id: 'preg1_4',
        heading: 'How to Actually Help Right Now',
        body: 'Take over cooking if smells bother her. Handle more household chores without being asked. Go to the first prenatal appointment together. Research together — but let her lead decisions. Don\'t share the news until she\'s ready.',
        keyTakeaway: 'Proactive help > reactive help. Anticipate needs before she has to ask.',
        emoji: '💪',
      },
    ],
  },
  {
    id: 'pregnancy_second_trimester',
    category: 'Pregnancy',
    title: 'Second Trimester Together',
    subtitle: 'Weeks 14–27: The "honeymoon" trimester',
    icon: <Flower2 size={20} color="#F59E0B" />,
    accentColor: '#F59E0B',
    cards: [
      {
        id: 'preg2_1',
        heading: 'Energy Returns (Usually)',
        body: 'Many women feel much better in the second trimester — nausea fades, energy increases, and the bump starts showing. This is often called the "honeymoon trimester." It\'s a great time for planning, bonding, and enjoying the pregnancy together.',
        keyTakeaway: 'Take advantage of this window. Plan the nursery, go on a babymoon, enjoy quality time.',
        emoji: '☀️',
      },
      {
        id: 'preg2_2',
        heading: 'Baby\'s First Kicks',
        body: 'Around weeks 18–22, she\'ll start feeling baby move ("quickening"). At first it feels like flutters or bubbles. Later, you may be able to feel kicks from outside. This is a powerful bonding moment — be patient and present for it.',
        keyTakeaway: 'Put your hand on her belly when she says baby is moving. Talk to the baby — they can hear you from week 18.',
        emoji: '👶',
      },
      {
        id: 'preg2_3',
        heading: 'Body Image & Intimacy Changes',
        body: 'Her body is changing rapidly — growing belly, weight gain, skin changes. She may feel beautiful or uncomfortable (or both). Intimacy may change too. Some women feel more desire, others less. Communication is key.',
        keyTakeaway: 'Compliment her genuinely. Ask about her comfort level. Never comment on weight gain.',
        emoji: '💕',
      },
      {
        id: 'preg2_4',
        heading: 'The Anatomy Scan (Week 18–20)',
        body: 'The mid-pregnancy ultrasound checks baby\'s organs, growth, and position. This is often when you can learn the sex (if you want). It\'s also when potential concerns may be flagged. Be there for this appointment — it\'s significant.',
        keyTakeaway: 'Attend the anatomy scan. If results raise concerns, stay calm and support her through next steps.',
        emoji: '🏥',
      },
    ],
  },
  {
    id: 'pregnancy_third_trimester',
    category: 'Pregnancy',
    title: 'Third Trimester & Birth Prep',
    subtitle: 'Weeks 28–40: The final stretch',
    icon: <Stethoscope size={20} color="#10B981" />,
    accentColor: '#10B981',
    cards: [
      {
        id: 'preg3_1',
        heading: 'She\'s Uncomfortable — And That\'s an Understatement',
        body: 'Back pain, heartburn, shortness of breath, trouble sleeping, frequent urination, swollen feet. The third trimester is physically demanding. She\'s carrying significant extra weight and her organs are literally being pushed aside.',
        keyTakeaway: 'Help with physical tasks. Offer foot rubs. Don\'t suggest she "just rest" — she can\'t get comfortable.',
        emoji: '😩',
      },
      {
        id: 'preg3_2',
        heading: 'Birth Plan & Hospital Bag',
        body: 'Help her finalize the birth plan — pain relief preferences, who\'s in the room, emergency scenarios. Pack the hospital bag together by week 36. Know the route to the hospital. Have the car seat installed.',
        keyTakeaway: 'Be prepared. Know her wishes so you can advocate for her during labor.',
        emoji: '🎒',
      },
      {
        id: 'preg3_3',
        heading: 'Your Role During Labor',
        body: 'You\'re her advocate, her comfort person, and her voice when she can\'t speak. Hold her hand. Offer water. Remind her to breathe. Speak to medical staff on her behalf if needed. Don\'t panic — your calm energy matters more than you think.',
        keyTakeaway: 'Practice breathing techniques together before the big day. Your calm = her calm.',
        emoji: '🤝',
      },
      {
        id: 'preg3_4',
        heading: 'Signs of Labor',
        body: 'Know the signs: regular contractions (5-1-1 rule — every 5 min, lasting 1 min, for 1 hour), water breaking, bloody show, intense back pain. False alarms are normal. When in doubt, call the hospital.',
        keyTakeaway: 'Have the hospital number saved. Time contractions with an app. Stay calm and supportive.',
        emoji: '⏱️',
      },
    ],
  },
  {
    id: 'postpartum_partner',
    category: 'Postpartum',
    title: 'Supporting Postpartum Recovery',
    subtitle: 'The "fourth trimester" — after baby arrives',
    icon: <HandHeart size={20} color="#6366F1" />,
    accentColor: '#6366F1',
    cards: [
      {
        id: 'post_1',
        heading: 'The First Two Weeks Are Survival Mode',
        body: 'She\'s recovering from a major physical event while caring for a newborn on no sleep. Bleeding, pain, hormonal crash, breastfeeding challenges, and emotional overwhelm are all normal. Your job: manage everything else.',
        keyTakeaway: 'Handle meals, cleaning, visitors, and errands. Her only job should be rest and baby.',
        emoji: '🏠',
      },
      {
        id: 'post_2',
        heading: 'Baby Blues vs. Postpartum Depression',
        body: 'Baby blues (mood swings, crying, anxiety) affect up to 80% of new mothers in the first 2 weeks and resolve on their own. Postpartum depression is more intense, lasts longer, and may include feeling disconnected from the baby, extreme guilt, or thoughts of self-harm.',
        keyTakeaway: 'If symptoms last beyond 2 weeks or intensify, encourage her to talk to her doctor. PANDA helpline: 1300 726 306.',
        emoji: '💙',
      },
      {
        id: 'post_3',
        heading: 'Breastfeeding Is Hard (Even When It\'s Natural)',
        body: 'Breastfeeding can be painful, frustrating, and emotionally loaded. Latch issues, supply worries, nipple damage, and cluster feeding are common. She doesn\'t need advice about formula vs. breast — she needs support for whatever she chooses.',
        keyTakeaway: 'Bring her water and snacks during feeds. Never judge the feeding method. Support > opinions.',
        emoji: '🤱',
      },
      {
        id: 'post_4',
        heading: 'Your Mental Health Matters Too',
        body: 'Up to 10% of new fathers experience paternal postnatal depression. Sleep deprivation, role changes, relationship shifts, and pressure to "be strong" all take a toll. It\'s okay to struggle. Seek help if you need it.',
        keyTakeaway: 'Check in with yourself. Talk to someone. You can\'t pour from an empty cup.',
        emoji: '🧠',
      },
    ],
  },
  {
    id: 'postpartum_csection_partner',
    category: 'Postpartum',
    title: 'C-Section Recovery: Partner Guide',
    subtitle: 'She had major surgery — here\'s how to help',
    icon: <Shield size={20} color="#EF4444" />,
    accentColor: '#EF4444',
    cards: [
      {
        id: 'csec_p1',
        heading: 'This Is Major Abdominal Surgery',
        body: 'A C-section involves cutting through skin, fascia, and the uterus. Recovery takes 6–8 weeks minimum. She cannot lift anything heavier than the baby, cannot drive for 4–6 weeks, and will need help with basic tasks like getting out of bed, showering, and picking things up off the floor.',
        keyTakeaway: 'Treat this like what it is: major surgery recovery WITH a newborn. She needs more help, not less.',
        emoji: '🏥',
      },
      {
        id: 'csec_p2',
        heading: 'Practical Help After C-Section',
        body: 'Help her in and out of bed (she\'ll need to roll to the side first). Bring the baby to her for feeds rather than having her get up. Handle all lifting — laundry, groceries, toddlers. Set up a "recovery station" with everything she needs within arm\'s reach: water, snacks, phone, remote, burp cloths.',
        keyTakeaway: 'Anticipate what she needs before she has to ask. Create a comfortable recovery space.',
        emoji: '🛋️',
      },
      {
        id: 'csec_p3',
        heading: 'Emotional Aspects of C-Section',
        body: 'Many mothers feel complex emotions after a C-section — especially if it was unplanned or emergency. She may grieve the birth experience she imagined. She may feel guilty for being disappointed when the baby is healthy. Never say "at least baby is safe" to dismiss her feelings. Both things can be true.',
        keyTakeaway: 'Her feelings about the birth are valid regardless of the outcome. Listen without minimising.',
        emoji: '💜',
      },
      {
        id: 'csec_p4',
        heading: 'Watch for Infection Signs',
        body: 'Monitor her incision for redness, swelling, warmth, oozing, or foul smell. Watch for fever above 38°C, increasing pain (not decreasing), or any flu-like symptoms. These could indicate infection, which needs prompt medical attention.',
        keyTakeaway: 'You may notice warning signs before she does. Be vigilant and don\'t hesitate to call the doctor.',
        emoji: '⚠️',
      },
    ],
  },
  {
    id: 'postpartum_sleep_partner',
    category: 'Postpartum',
    title: 'Managing Sleep Deprivation Together',
    subtitle: 'Survival strategies for exhausted parents',
    icon: <Moon size={20} color="#6366F1" />,
    accentColor: '#6366F1',
    cards: [
      {
        id: 'sleep_p1',
        heading: 'Sleep Deprivation Is Not a Competition',
        body: 'Both of you will be tired. Saying "I\'m tired too" when she\'s been up every 2 hours nursing is not helpful. Acknowledge that her sleep disruption is likely more severe, especially if breastfeeding. This isn\'t about keeping score — it\'s about teamwork.',
        keyTakeaway: 'Avoid comparing tiredness. Focus on how you can help each other get more rest.',
        emoji: '🤝',
      },
      {
        id: 'sleep_p2',
        heading: 'Shift System Strategies',
        body: 'If bottle feeding or pumping: take turns with night feeds. One parent does the 10pm–2am shift, the other does 2am–6am. If exclusively breastfeeding: you handle everything else — nappy changes, settling, burping — so she can sleep immediately after feeding.',
        keyTakeaway: 'Create a system that gives each parent one longer sleep block. Consistency helps.',
        emoji: '🔄',
      },
      {
        id: 'sleep_p3',
        heading: 'Protect Her Nap Time',
        body: 'When she naps during the day, be the gatekeeper. Do not vacuum, do not let visitors ring the doorbell, do not ask her questions. Take the baby out for a walk. Her sleep is not optional — it\'s essential for recovery, milk production, and mental health.',
        keyTakeaway: 'Guard her sleep like it\'s the most important thing you can do. Because it is.',
        emoji: '🛡️',
      },
    ],
  },
  {
    id: 'postpartum_relationship_partner',
    category: 'Postpartum',
    title: 'Your Relationship After Baby',
    subtitle: 'Navigating the biggest change together',
    icon: <Heart size={20} color="#EC4899" />,
    accentColor: '#EC4899',
    cards: [
      {
        id: 'rel_p1',
        heading: 'Your Relationship Will Change — And That\'s Normal',
        body: 'Less time together, more stress, reduced intimacy, and different priorities. You may feel sidelined by the baby. She may feel touched-out from constant feeding and holding. Communication becomes more transactional. This phase is temporary but real.',
        keyTakeaway: 'Acknowledge the change openly. "This is hard, but we\'re a team" goes a long way.',
        emoji: '💬',
      },
      {
        id: 'rel_p2',
        heading: 'Intimacy Takes Time to Return',
        body: 'Physical recovery from birth takes at least 6 weeks. Hormonal changes (especially with breastfeeding) reduce desire. She may feel self-conscious about her changed body. Exhaustion is the biggest libido killer. Physical intimacy will return, but on a different timeline.',
        keyTakeaway: 'Do not pressure or hint. Show love through acts of service and affection. Patience is attractive.',
        emoji: '❤️',
      },
      {
        id: 'rel_p3',
        heading: 'The Mental Load Is Real',
        body: 'The "mental load" is all the invisible planning, remembering, and decision-making: tracking feeds, remembering doctor appointments, noticing when nappies are running low, researching sleep methods. Even if you split physical tasks 50/50, the mental load often falls on one person.',
        keyTakeaway: 'Don\'t wait to be told — notice what needs doing and do it. Take ownership of specific responsibilities.',
        emoji: '🧠',
      },
      {
        id: 'rel_p4',
        heading: 'Stay Connected in Small Ways',
        body: 'You won\'t have date nights for a while. But you can: bring her coffee in the morning, text something kind during the day, watch a show together after baby sleeps, order her favourite takeaway, tell her she\'s doing an amazing job. Small gestures sustain the relationship.',
        keyTakeaway: 'Connection happens in micro-moments. Find them every day.',
        emoji: '☕',
      },
    ],
  },
];

const TOTAL_CARDS = EDUCATION_TOPICS.reduce((sum, t) => sum + t.cards.length, 0);

function ProgressBar({ progress, color }: { progress: number; color: string }) {
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: progress,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [progress, animWidth]);

  const width = animWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.progressBarBg}>
      <Animated.View style={[styles.progressBarFill, { width, backgroundColor: color }]} />
    </View>
  );
}

function TopicCard({
  topic,
  isExpanded,
  onToggle,
  index,
}: {
  topic: EducationTopic;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const { getTopicProgress, markCardRead } = useEducationProgressStore();

  const progress = getTopicProgress(topic.id, topic.cards.length);
  const completedCount = Math.round(progress * topic.cards.length);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, fadeAnim, slideAnim]);

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isExpanded, rotateAnim]);

  const chevronRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <Animated.View
      style={[
        styles.topicContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.topicHeader, { borderLeftColor: topic.accentColor }]}
        onPress={onToggle}
        activeOpacity={0.7}
        testID={`education-topic-${topic.id}`}
      >
        <View style={[styles.topicIconBox, { backgroundColor: topic.accentColor + '18' }]}>
          {topic.icon}
        </View>
        <View style={styles.topicHeaderText}>
          <View style={styles.topicTitleRow}>
            <Text style={[styles.topicCategory, { color: topic.accentColor }]}>
              {topic.category}
            </Text>
            {progress >= 1 && (
              <CheckCircle size={14} color={Colors.success} />
            )}
          </View>
          <Text style={styles.topicTitle}>{topic.title}</Text>
          <View style={styles.topicProgressRow}>
            <ProgressBar progress={progress} color={topic.accentColor} />
            <Text style={styles.progressText}>{completedCount}/{topic.cards.length}</Text>
          </View>
        </View>
        <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
          <ChevronDown size={20} color={Colors.textLight} />
        </Animated.View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.cardsContainer}>
          {topic.cards.map((card, cardIndex) => (
            <MicroCard
              key={card.id}
              card={card}
              topicId={topic.id}
              accentColor={topic.accentColor}
              index={cardIndex}
              onRead={() => markCardRead(topic.id, card.id)}
            />
          ))}
        </View>
      )}
    </Animated.View>
  );
}

function MicroCard({
  card,
  topicId,
  accentColor,
  index,
  onRead,
}: {
  card: EducationCard;
  topicId: string;
  accentColor: string;
  index: number;
  onRead: () => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { isCardRead } = useEducationProgressStore();
  const isRead = isCardRead(topicId, card.id);
  const hasTriggeredRead = useRef(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, [index, fadeAnim]);

  useEffect(() => {
    if (!isRead && !hasTriggeredRead.current) {
      hasTriggeredRead.current = true;
      const timer = setTimeout(() => {
        onRead();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isRead, onRead]);

  return (
    <Animated.View style={[styles.microCard, { opacity: fadeAnim }]}>
      <View style={styles.microCardHeader}>
        <Text style={styles.microCardEmoji}>{card.emoji}</Text>
        <Text style={styles.microCardHeading}>{card.heading}</Text>
        {isRead && (
          <CheckCircle size={16} color={Colors.success} />
        )}
      </View>
      <Text style={styles.microCardBody}>{card.body}</Text>
      <View style={[styles.takeawayBox, { backgroundColor: accentColor + '12', borderColor: accentColor + '30' }]}>
        <Sparkles size={13} color={accentColor} />
        <Text style={[styles.takeawayText, { color: accentColor }]}>
          {card.keyTakeaway}
        </Text>
      </View>
      {!isRead && (
        <TouchableOpacity
          style={[styles.markReadButton, { borderColor: accentColor + '40' }]}
          onPress={onRead}
          activeOpacity={0.7}
        >
          <CheckCircle size={14} color={accentColor} />
          <Text style={[styles.markReadText, { color: accentColor }]}>Mark as read</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

export default function PartnerEducationScreen() {
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const { initialize, getTotalCompleted } = useEducationProgressStore();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const totalCompleted = getTotalCompleted();
  const overallProgress = TOTAL_CARDS > 0 ? totalCompleted / TOTAL_CARDS : 0;

  const handleToggle = useCallback((topicId: string) => {
    setExpandedTopicId((prev) => (prev === topicId ? null : topicId));
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Partner Education' }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroIconRow}>
            <BookOpen size={24} color={Colors.gold} />
            <Brain size={20} color={Colors.accent} />
          </View>
          <Text style={styles.heroTitle}>Understanding Her Health</Text>
          <Text style={styles.heroSubtitle}>
            Short, science-backed micro-lessons to help you understand hormonal cycles, mood patterns, and how to be a better partner.
          </Text>

          <View style={styles.overallProgressContainer}>
            <View style={styles.overallProgressHeader}>
              <Text style={styles.overallProgressLabel}>Your Progress</Text>
              <Text style={styles.overallProgressPercent}>{Math.round(overallProgress * 100)}%</Text>
            </View>
            <ProgressBar progress={overallProgress} color={Colors.gold} />
            <Text style={styles.overallProgressDetail}>
              {totalCompleted} of {TOTAL_CARDS} lessons completed
            </Text>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNumber}>{EDUCATION_TOPICS.length}</Text>
              <Text style={styles.heroStatLabel}>Topics</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNumber}>{TOTAL_CARDS}</Text>
              <Text style={styles.heroStatLabel}>Micro-lessons</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNumber}>~2min</Text>
              <Text style={styles.heroStatLabel}>Each</Text>
            </View>
          </View>
        </View>

        {EDUCATION_TOPICS.map((topic, index) => (
          <TopicCard
            key={topic.id}
            topic={topic}
            isExpanded={expandedTopicId === topic.id}
            onToggle={() => handleToggle(topic.id)}
            index={index}
          />
        ))}

        <View style={styles.footerCard}>
          <Shield size={18} color={Colors.textLight} />
          <Text style={styles.footerText}>
            This content is for educational purposes only and does not replace professional medical advice. Every person is unique.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 22,
    marginBottom: 20,
  },
  heroIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 21,
    marginBottom: 18,
  },
  overallProgressContainer: {
    backgroundColor: Colors.muted,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  overallProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  overallProgressLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  overallProgressPercent: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.gold,
  },
  overallProgressDetail: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 6,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.muted,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatNumber: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.gold,
    marginBottom: 2,
  },
  heroStatLabel: {
    fontSize: 11,
    color: Colors.textLight,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  heroDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  topicContainer: {
    marginBottom: 12,
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    padding: 16,
    gap: 12,
  },
  topicIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicHeaderText: {
    flex: 1,
  },
  topicTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  topicCategory: {
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  topicTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  topicProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.muted,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: Colors.textLight,
    fontWeight: '600' as const,
    minWidth: 24,
  },
  cardsContainer: {
    paddingLeft: 4,
    paddingTop: 8,
  },
  microCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 8,
  },
  microCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  microCardEmoji: {
    fontSize: 22,
  },
  microCardHeading: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    flex: 1,
  },
  microCardBody: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 20,
    marginBottom: 12,
  },
  takeawayBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  takeawayText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 18,
  },
  markReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  markReadText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  footerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 16,
    marginTop: 8,
  },
  footerText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textLight,
    lineHeight: 18,
  },
});
