export interface PostpartumFAQ {
  id: string;
  question: string;
  answer: string;
  category: 'physical' | 'emotional' | 'baby' | 'relationships' | 'practical';
  deliverySpecific: 'all' | 'vaginal' | 'c_section';
  tags: string[];
  emoji: string;
}

export const POSTPARTUM_FAQ: PostpartumFAQ[] = [
  {
    id: 'faq_bleeding_duration',
    question: 'How long does postpartum bleeding last?',
    answer: 'Postpartum bleeding (lochia) typically lasts 4–6 weeks. It starts heavy and red, then gradually lightens to pink and then yellowish-white. If bleeding suddenly increases, you pass large clots, or it smells foul, contact your doctor.',
    category: 'physical',
    deliverySpecific: 'all',
    tags: ['bleeding', 'lochia', 'duration'],
    emoji: '🩸',
  },
  {
    id: 'faq_sex_after_birth',
    question: 'When can I have sex again after birth?',
    answer: 'Most doctors recommend waiting at least 6 weeks, until after your postpartum checkup. However, there is no rush — many women do not feel ready for months. Hormonal changes (especially if breastfeeding) can reduce desire and cause vaginal dryness. Use lubricant, go slowly, and communicate with your partner. Pain during sex is not normal — talk to your doctor if this continues.',
    category: 'relationships',
    deliverySpecific: 'all',
    tags: ['sex', 'intimacy', 'six weeks'],
    emoji: '💕',
  },
  {
    id: 'faq_csection_incision',
    question: 'How do I care for my C-section incision?',
    answer: 'Keep the incision clean and dry. Gently wash with mild soap and water daily. Pat dry — do not rub. Avoid submerging in baths or pools until fully healed. Watch for signs of infection: redness, swelling, warmth, oozing, or fever. Wear loose clothing that does not rub the area. Numbness around the scar is normal and may last months.',
    category: 'physical',
    deliverySpecific: 'c_section',
    tags: ['c-section', 'incision', 'wound care'],
    emoji: '🩹',
  },
  {
    id: 'faq_csection_driving',
    question: 'When can I drive after a C-section?',
    answer: 'Most doctors recommend waiting 4–6 weeks after a C-section before driving. You need to be able to perform an emergency stop without pain and turn to check blind spots comfortably. Check with your insurance company too, as some have specific requirements.',
    category: 'practical',
    deliverySpecific: 'c_section',
    tags: ['c-section', 'driving', 'restrictions'],
    emoji: '🚗',
  },
  {
    id: 'faq_csection_lifting',
    question: 'What can I lift after a C-section?',
    answer: 'For the first 6 weeks, avoid lifting anything heavier than your baby. This includes toddlers, heavy shopping bags, and laundry baskets. Lifting too much too soon can strain your incision and delay healing. After your 6-week checkup, gradually increase what you lift.',
    category: 'physical',
    deliverySpecific: 'c_section',
    tags: ['c-section', 'lifting', 'restrictions'],
    emoji: '🏋️',
  },
  {
    id: 'faq_stitches_healing',
    question: 'How long do perineal stitches take to heal?',
    answer: 'Dissolvable stitches from a tear or episiotomy typically dissolve within 2–4 weeks. The area may feel sore for several weeks. Use a peri bottle with warm water when using the toilet, sit on a cushion, and try sitz baths. If pain increases rather than decreases, or you notice a foul smell, see your doctor.',
    category: 'physical',
    deliverySpecific: 'vaginal',
    tags: ['stitches', 'perineal', 'healing', 'tear'],
    emoji: '🩺',
  },
  {
    id: 'faq_baby_blues_vs_ppd',
    question: 'How do I know if it is baby blues or postpartum depression?',
    answer: 'Baby blues are common (80% of mothers), start within days of birth, and resolve within 2 weeks. Symptoms include mood swings, crying, and feeling overwhelmed.\n\nPostpartum depression is more intense, lasts longer (beyond 2 weeks), and may include persistent sadness, difficulty bonding with baby, withdrawal from others, extreme guilt, appetite changes, and thoughts of self-harm.\n\nIf you are unsure, talk to your doctor. It is always better to ask than to suffer in silence. PANDA: 1300 726 306.',
    category: 'emotional',
    deliverySpecific: 'all',
    tags: ['baby blues', 'PPD', 'depression', 'mental health'],
    emoji: '💙',
  },
  {
    id: 'faq_breastfeeding_pain',
    question: 'Is breastfeeding supposed to hurt?',
    answer: 'Mild discomfort in the first few days is normal as your nipples adjust. However, ongoing pain, cracked or bleeding nipples, or pain that makes you dread feeding usually indicates a latch issue. A lactation consultant can assess and help. Nipple shields, lanolin cream, and ensuring a deep latch can all help. Pain is not something you should just "push through."',
    category: 'baby',
    deliverySpecific: 'all',
    tags: ['breastfeeding', 'pain', 'latch', 'nipples'],
    emoji: '🤱',
  },
  {
    id: 'faq_milk_supply',
    question: 'How do I know if my baby is getting enough milk?',
    answer: 'Signs baby is getting enough: 6+ wet nappies per day after day 4, steady weight gain after the initial drop, baby seems satisfied after feeds, and you can hear swallowing during feeds.\n\nSigns to watch: fewer wet nappies, excessive weight loss (more than 10% of birth weight), baby constantly unsettled, or very sleepy and hard to wake for feeds.\n\nFrequent feeding does not necessarily mean low supply — newborns feed 8–12 times per day. If concerned, see your midwife or lactation consultant.',
    category: 'baby',
    deliverySpecific: 'all',
    tags: ['breastfeeding', 'milk supply', 'weight', 'feeding'],
    emoji: '🍼',
  },
  {
    id: 'faq_constipation',
    question: 'Why am I so constipated after birth?',
    answer: 'Postpartum constipation is very common, caused by hormonal changes, iron supplements, pain medication, dehydration, and fear of pain (especially with stitches). To help: drink plenty of water, eat high-fibre foods, walk gently, and ask your doctor about a stool softener. Do not strain — support your perineum with a pad if you had stitches.',
    category: 'physical',
    deliverySpecific: 'all',
    tags: ['constipation', 'bowel', 'digestion'],
    emoji: '😩',
  },
  {
    id: 'faq_night_sweats',
    question: 'Why do I sweat so much at night after having a baby?',
    answer: 'Postpartum night sweats are caused by rapidly dropping estrogen levels and your body getting rid of excess fluid from pregnancy. They are common in the first 2–6 weeks. Sleep on a towel, wear breathable fabrics, keep the room cool, and stay hydrated. If sweats continue beyond 6 weeks or come with fever, see your doctor to rule out thyroid issues.',
    category: 'physical',
    deliverySpecific: 'all',
    tags: ['night sweats', 'hormones', 'sleep'],
    emoji: '💦',
  },
  {
    id: 'faq_hair_falling',
    question: 'Why is my hair falling out in clumps?',
    answer: 'Postpartum hair loss (telogen effluvium) is very common, usually starting around 3–4 months after birth. During pregnancy, high estrogen kept hair in the growth phase. After birth, all that "bonus" hair sheds at once. It is temporary — regrowth typically starts by 6 months. Eat well, be gentle with your hair, and see your doctor if it continues beyond 12 months.',
    category: 'physical',
    deliverySpecific: 'all',
    tags: ['hair loss', 'shedding', 'hormones'],
    emoji: '💇',
  },
  {
    id: 'faq_exercise_start',
    question: 'When can I start exercising again?',
    answer: 'Gentle walking and pelvic floor exercises can start within days of a vaginal birth, or once comfortable after a C-section. Wait for your 6-week checkup before more intense exercise. Avoid sit-ups, crunches, and running until checked for diastasis recti (abdominal separation). A postnatal physiotherapist can create a safe plan for you.',
    category: 'physical',
    deliverySpecific: 'all',
    tags: ['exercise', 'fitness', 'return', 'timeline'],
    emoji: '🏃‍♀️',
  },
  {
    id: 'faq_partner_ppd',
    question: 'Can my partner get postpartum depression too?',
    answer: 'Yes. Up to 10% of new fathers/partners experience paternal postnatal depression. Symptoms include irritability, withdrawal, anger, increased alcohol use, working excessively, and feeling disconnected from baby. Sleep deprivation, relationship changes, and pressure to "be strong" all contribute. Partners should seek help if they are struggling. Beyond Blue: 1300 22 4636.',
    category: 'emotional',
    deliverySpecific: 'all',
    tags: ['partner', 'depression', 'paternal', 'mental health'],
    emoji: '🧠',
  },
  {
    id: 'faq_bonding_difficulty',
    question: 'I do not feel bonded to my baby. Is something wrong with me?',
    answer: 'No. Instant bonding is a myth for many parents. Some feel an overwhelming connection at birth; others take weeks or months. This does not make you a bad parent. Bonding grows through daily care: feeding, nappy changes, skin-to-skin, talking to your baby. If you feel persistently disconnected or are having intrusive thoughts, speak to your healthcare provider — this can be a sign of PPD.',
    category: 'emotional',
    deliverySpecific: 'all',
    tags: ['bonding', 'attachment', 'baby', 'guilt'],
    emoji: '👶',
  },
  {
    id: 'faq_body_different',
    question: 'Will my body ever feel "normal" again?',
    answer: 'Your body has done something extraordinary. It will change and heal, but it may not return to exactly how it was — and that is okay. The uterus takes 6–8 weeks to shrink back. Abdominal muscles may take months to come together. Breasts change with breastfeeding. Weight loss should be gradual and gentle. Focus on how you feel, not how you look. Treat your body with the respect it deserves.',
    category: 'physical',
    deliverySpecific: 'all',
    tags: ['body image', 'recovery', 'weight', 'self-care'],
    emoji: '🌸',
  },
  {
    id: 'faq_crying_baby',
    question: 'My baby cries all the time. What am I doing wrong?',
    answer: 'Crying is a baby\'s primary communication method. You are not doing anything wrong. Newborns cry for hunger, wet nappies, tiredness, overstimulation, temperature, or sometimes for no clear reason.\n\nPeak crying happens around 6–8 weeks and then decreases. If baby is fed, changed, and safe, it is okay to put them down in a safe space and take a breather.\n\nExcessive crying with arching, pulling legs up, or refusing feeds may indicate colic, reflux, or allergies — discuss with your doctor.\n\nRemember: You cannot spoil a newborn by responding to their cries.',
    category: 'baby',
    deliverySpecific: 'all',
    tags: ['crying', 'colic', 'newborn', 'soothing'],
    emoji: '😢',
  },
  {
    id: 'faq_contraception',
    question: 'When should I think about contraception after birth?',
    answer: 'You can get pregnant as early as 3 weeks postpartum, even before your period returns. Breastfeeding offers some protection (LAM method) but is not reliable beyond 6 months or if supplementing with formula.\n\nContraception options to discuss at your 6-week checkup:\n• Mini-pill (progestogen only) — safe while breastfeeding\n• Implant or IUD — long-acting, low maintenance\n• Condoms — no hormones, available immediately\n• Combined pill — wait until 6 weeks (not recommended while breastfeeding)\n\nDiscuss your options with your doctor based on your breastfeeding status and preferences.',
    category: 'practical',
    deliverySpecific: 'all',
    tags: ['contraception', 'birth control', 'family planning'],
    emoji: '💊',
  },
];

export function searchFAQ(query: string, deliveryType?: 'vaginal' | 'c_section' | 'vbac'): PostpartumFAQ[] {
  const lowerQuery = query.toLowerCase();
  const effectiveType = deliveryType === 'vbac' ? 'vaginal' : deliveryType;

  return POSTPARTUM_FAQ.filter(faq => {
    const typeMatch = !effectiveType || faq.deliverySpecific === 'all' || faq.deliverySpecific === effectiveType;
    const textMatch =
      faq.question.toLowerCase().includes(lowerQuery) ||
      faq.answer.toLowerCase().includes(lowerQuery) ||
      faq.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
    return typeMatch && textMatch;
  });
}

export const FAQ_CATEGORIES = [
  { id: 'all' as const, label: 'All', emoji: '📚' },
  { id: 'physical' as const, label: 'Physical', emoji: '🩺' },
  { id: 'emotional' as const, label: 'Emotional', emoji: '💙' },
  { id: 'baby' as const, label: 'Baby Care', emoji: '👶' },
  { id: 'relationships' as const, label: 'Relationships', emoji: '💑' },
  { id: 'practical' as const, label: 'Practical', emoji: '📋' },
];
