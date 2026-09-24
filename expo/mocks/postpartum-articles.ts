export interface PostpartumArticle {
  id: string;
  title: string;
  summary: string;
  body: string;
  category: 'physical' | 'emotional' | 'baby_care' | 'relationships' | 'nutrition' | 'exercise';
  relevantWeeks: { min: number; max: number };
  deliveryType: 'all' | 'vaginal' | 'c_section';
  forPartner: boolean;
  tags: string[];
  emoji: string;
}

export const POSTPARTUM_ARTICLES: PostpartumArticle[] = [
  {
    id: 'pp_bleeding_lochia',
    title: 'Understanding Lochia: Postpartum Bleeding',
    summary: 'What to expect with postpartum bleeding and when to seek help.',
    body: 'After delivery, your body sheds the uterine lining through a process called lochia. This is normal and happens regardless of delivery type.\n\nWeeks 1–2: Lochia rubra — bright red, heavy flow similar to a heavy period. You may pass small clots.\n\nWeeks 2–4: Lochia serosa — pinkish-brown, lighter flow. Clots should decrease.\n\nWeeks 4–6: Lochia alba — yellowish-white, very light discharge that gradually stops.\n\nWhen to call your doctor:\n• Soaking more than one pad per hour\n• Passing clots larger than a golf ball\n• Foul-smelling discharge\n• Fever above 38°C (100.4°F)\n• Bleeding that suddenly gets heavier after lightening\n\nTips: Use maternity pads (not tampons) for the first 6 weeks. Stay hydrated and rest as much as possible.',
    category: 'physical',
    relevantWeeks: { min: 0, max: 6 },
    deliveryType: 'all',
    forPartner: false,
    tags: ['bleeding', 'lochia', 'recovery', 'warning signs'],
    emoji: '🩸',
  },
  {
    id: 'pp_csection_recovery',
    title: 'C-Section Recovery: Week by Week',
    summary: 'Your body just went through major surgery. Here is what recovery looks like.',
    body: 'A caesarean section is major abdominal surgery. Recovery takes longer than vaginal birth, and that is completely okay.\n\nWeek 1: Pain around the incision is normal. You will need help getting in and out of bed. Hold a pillow against your belly when coughing or laughing. Walking short distances helps prevent blood clots.\n\nWeeks 2–3: Pain gradually decreases. You can start gentle walks. Avoid lifting anything heavier than your baby. The incision may feel numb or itchy — this is normal nerve healing.\n\nWeeks 4–6: Most daily activities become easier. You may still tire quickly. The scar continues to heal internally even after the outside looks closed.\n\nAfter 6 weeks: Your doctor will clear you for exercise and driving at your checkup. Full internal healing takes 3–6 months.\n\nIncision care:\n• Keep the area clean and dry\n• Watch for redness, swelling, or discharge\n• Wear loose, comfortable clothing\n• Avoid submerging in water until cleared by your doctor',
    category: 'physical',
    relevantWeeks: { min: 0, max: 12 },
    deliveryType: 'c_section',
    forPartner: false,
    tags: ['c-section', 'surgery', 'incision', 'recovery'],
    emoji: '🩹',
  },
  {
    id: 'pp_vaginal_recovery',
    title: 'Vaginal Birth Recovery Guide',
    summary: 'Perineal healing, soreness, and getting back to normal.',
    body: 'After a vaginal birth, your perineum (the area between the vagina and rectum) needs time to heal, especially if you had a tear or episiotomy.\n\nWeek 1: Expect swelling, bruising, and soreness. Ice packs wrapped in a cloth can help. Sit on a soft cushion or donut pillow. Use a peri bottle (squirt bottle) with warm water when using the toilet.\n\nWeeks 2–3: Swelling decreases. Stitches (if any) dissolve on their own. Sitz baths can provide relief.\n\nWeeks 4–6: Most soreness resolves. Pelvic floor exercises (Kegels) help restore strength. You may feel heaviness or pressure — this is common and usually improves.\n\nTips for comfort:\n• Witch hazel pads can soothe the area\n• Avoid straining during bowel movements — use a stool softener if needed\n• Wear loose cotton underwear\n• Let the area air-dry when possible\n\nCall your doctor if you notice increasing pain, foul-smelling discharge, or fever.',
    category: 'physical',
    relevantWeeks: { min: 0, max: 6 },
    deliveryType: 'vaginal',
    forPartner: false,
    tags: ['perineal', 'tears', 'stitches', 'recovery'],
    emoji: '💜',
  },
  {
    id: 'pp_baby_blues',
    title: 'Baby Blues: What Is Normal?',
    summary: 'Up to 80% of new mothers experience baby blues. You are not alone.',
    body: 'The "baby blues" are very common emotional changes that happen in the first 2 weeks after birth. They are caused by the dramatic drop in pregnancy hormones (estrogen and progesterone) combined with sleep deprivation and the overwhelming adjustment to parenthood.\n\nCommon symptoms:\n• Crying for no clear reason\n• Feeling overwhelmed or anxious\n• Mood swings — happy one moment, tearful the next\n• Irritability\n• Difficulty sleeping even when baby is sleeping\n• Feeling disconnected or "not yourself"\n\nBaby blues typically peak around days 3–5 and resolve within 2 weeks.\n\nWhat helps:\n• Accept help from others\n• Sleep when baby sleeps (even if it feels impossible)\n• Talk to someone you trust about how you feel\n• Fresh air and gentle movement\n• Eat nourishing meals (have others prepare them)\n• Limit visitors if they drain your energy\n\nIMPORTANT: If symptoms persist beyond 2 weeks, worsen, or include thoughts of harming yourself or your baby, this may be postpartum depression. Please reach out to your healthcare provider or PANDA helpline: 1300 726 306.',
    category: 'emotional',
    relevantWeeks: { min: 0, max: 4 },
    deliveryType: 'all',
    forPartner: true,
    tags: ['baby blues', 'mood', 'crying', 'hormones', 'mental health'],
    emoji: '💙',
  },
  {
    id: 'pp_postpartum_depression',
    title: 'Postpartum Depression: Signs & Support',
    summary: 'PPD is not a weakness — it is a medical condition that responds well to treatment.',
    body: 'Postpartum depression (PPD) affects approximately 1 in 7 new mothers. It can start any time in the first year after birth and is different from baby blues.\n\nSigns of PPD:\n• Persistent sadness or emptiness lasting more than 2 weeks\n• Loss of interest in things you usually enjoy\n• Difficulty bonding with your baby\n• Withdrawing from partner, family, or friends\n• Changes in appetite or sleep (beyond normal newborn disruptions)\n• Overwhelming fatigue or loss of energy\n• Feelings of worthlessness or excessive guilt\n• Difficulty concentrating or making decisions\n• Anxiety or panic attacks\n• Thoughts of harming yourself or your baby\n\nRisk factors include:\n• History of depression or anxiety\n• Difficult pregnancy or birth\n• Lack of support\n• Relationship problems\n• Financial stress\n• Traumatic birth experience\n\nTreatment works:\n• Therapy (CBT is highly effective)\n• Medication (safe options exist for breastfeeding)\n• Support groups\n• Lifestyle adjustments\n\nYou are not failing as a mother. PPD is a medical condition, not a character flaw. Seeking help is the strongest thing you can do.\n\nPANDA Helpline: 1300 726 306\nBeyond Blue: 1300 22 4636\nLifeline: 13 11 14',
    category: 'emotional',
    relevantWeeks: { min: 0, max: 52 },
    deliveryType: 'all',
    forPartner: true,
    tags: ['depression', 'PPD', 'mental health', 'therapy', 'helplines'],
    emoji: '🫂',
  },
  {
    id: 'pp_postpartum_anxiety',
    title: 'Postpartum Anxiety: The Hidden Struggle',
    summary: 'Anxiety after birth is common but often overlooked. Learn the signs.',
    body: 'While postpartum depression gets more attention, postpartum anxiety (PPA) is equally common and can be just as debilitating.\n\nSigns of PPA:\n• Constant worry that something bad will happen to the baby\n• Racing thoughts, especially at night\n• Checking on baby excessively\n• Inability to sit still or relax\n• Physical symptoms: racing heart, nausea, tight chest\n• Difficulty sleeping even when exhausted\n• Feeling "on edge" all the time\n• Avoiding situations for fear something will go wrong\n\nPPA is more than normal new-parent worry. If anxiety is interfering with your daily life, sleep, or ability to care for yourself or baby, it is time to seek help.\n\nWhat helps:\n• Talk to your doctor or midwife\n• Therapy (especially CBT)\n• Breathing exercises and grounding techniques\n• Reducing caffeine intake\n• Gentle exercise\n• Sharing your feelings with someone who listens without judgment\n\nRemember: Being anxious does not make you a bad parent. It means your brain is in overdrive trying to protect your baby. With support, it gets better.',
    category: 'emotional',
    relevantWeeks: { min: 0, max: 52 },
    deliveryType: 'all',
    forPartner: true,
    tags: ['anxiety', 'PPA', 'worry', 'mental health', 'panic'],
    emoji: '😰',
  },
  {
    id: 'pp_breastfeeding_basics',
    title: 'Breastfeeding: Getting Started',
    summary: 'Common challenges and how to work through the early days.',
    body: 'Breastfeeding is natural but not always easy. Most mothers face challenges in the early days.\n\nFirst 24–48 hours: Colostrum (thick, yellowish milk) is all baby needs. Volumes are tiny — just teaspoons — but packed with antibodies.\n\nDays 3–5: Milk "comes in" — breasts may feel full, hard, or tender. This is engorgement and is temporary.\n\nWeeks 1–2: Cluster feeding is normal (baby feeds very frequently, sometimes hourly). This helps establish your supply.\n\nCommon challenges:\n• Sore or cracked nipples — usually caused by shallow latch. Seek lactation support early.\n• Engorgement — express a little milk before feeding to soften the breast.\n• Low supply worries — frequent feeding and skin-to-skin contact help.\n• Blocked ducts — massage gently toward the nipple while feeding.\n• Mastitis — flu-like symptoms with a red, hot area on the breast. See your doctor promptly.\n\nRemember:\n• Fed is best. There is no wrong choice between breast and bottle.\n• Ask for help — lactation consultants, midwives, and breastfeeding support groups exist for a reason.\n• Your partner can support by bringing water and snacks, burping baby, and handling other tasks.',
    category: 'baby_care',
    relevantWeeks: { min: 0, max: 12 },
    deliveryType: 'all',
    forPartner: true,
    tags: ['breastfeeding', 'latch', 'engorgement', 'mastitis', 'feeding'],
    emoji: '🤱',
  },
  {
    id: 'pp_sleep_deprivation',
    title: 'Surviving Sleep Deprivation',
    summary: 'Practical strategies when you are running on empty.',
    body: 'Sleep deprivation is one of the hardest parts of early parenthood. Newborns wake every 2–3 hours, and this takes a real toll on your physical and mental health.\n\nWhy it matters:\n• Sleep deprivation worsens mood, anxiety, and ability to cope\n• It impairs memory, decision-making, and reaction time\n• It can trigger or worsen postpartum depression\n\nSurvival strategies:\n• Sleep when baby sleeps — ignore the dishes and laundry\n• Take turns with your partner for night feeds (pump if breastfeeding)\n• Accept help: let someone watch baby while you nap\n• Lower your standards for housework — survival mode is okay\n• Avoid screens before sleep — blue light makes it harder to fall asleep\n• Keep the bedroom cool and dark\n\nFor partners:\n• Take the early morning shift so she can sleep a longer stretch\n• Handle night nappy changes even if she is doing the feeding\n• Protect her nap time — manage visitors and noise\n\nIt does get better. Most babies start sleeping longer stretches by 3–4 months. You are doing an incredible job.',
    category: 'physical',
    relevantWeeks: { min: 0, max: 16 },
    deliveryType: 'all',
    forPartner: true,
    tags: ['sleep', 'fatigue', 'night feeds', 'exhaustion'],
    emoji: '😴',
  },
  {
    id: 'pp_pelvic_floor',
    title: 'Pelvic Floor Recovery',
    summary: 'Strengthening your pelvic floor after birth — why it matters.',
    body: 'Your pelvic floor muscles support your bladder, uterus, and bowel. Pregnancy and birth stretch and weaken these muscles, which can lead to issues like incontinence.\n\nCommon pelvic floor issues after birth:\n• Leaking urine when coughing, sneezing, or laughing\n• Urgency — suddenly needing to go\n• Heaviness or "dragging" sensation in the pelvis\n• Reduced sensation during intimacy\n\nWhen to start pelvic floor exercises:\n• Vaginal birth: You can begin gentle Kegels within days, even if sore.\n• C-section: Start gentle Kegels once catheter is removed and you feel ready.\n\nHow to do Kegels:\n1. Squeeze the muscles you would use to stop urinating midstream\n2. Hold for 5 seconds, then release for 5 seconds\n3. Repeat 10 times, 3 times daily\n4. Gradually increase hold time to 10 seconds\n\nImportant:\n• Do NOT actually stop urinating midstream — this is just to help you identify the muscles\n• If symptoms persist beyond 6 weeks, ask your doctor for a referral to a pelvic floor physiotherapist\n• A "mummy tummy" (diastasis recti) is a separate issue — ask your physio about this too',
    category: 'exercise',
    relevantWeeks: { min: 1, max: 52 },
    deliveryType: 'all',
    forPartner: false,
    tags: ['pelvic floor', 'Kegels', 'incontinence', 'exercise'],
    emoji: '💪',
  },
  {
    id: 'pp_nutrition_recovery',
    title: 'Nourishing Your Body After Birth',
    summary: 'What to eat to support recovery and energy levels.',
    body: 'Your body needs good nutrition to recover from birth, whether vaginal or caesarean. If you are breastfeeding, your calorie needs are even higher than during pregnancy.\n\nKey nutrients for recovery:\n• Iron — replenish stores lost during birth. Red meat, lentils, spinach, fortified cereals.\n• Protein — supports tissue repair. Eggs, chicken, fish, beans, nuts.\n• Calcium — important for bone health, especially if breastfeeding. Dairy, fortified plant milk, sardines.\n• Omega-3 fatty acids — support brain health and mood. Oily fish (salmon, sardines), walnuts, flaxseeds.\n• Fibre — prevents constipation (very common postpartum). Whole grains, fruits, vegetables.\n• Vitamin C — supports wound healing. Citrus, capsicum, berries, tomatoes.\n• Fluids — aim for 2–3 litres daily, more if breastfeeding.\n\nPractical tips:\n• Prepare freezer meals before birth or ask friends to bring meals\n• Keep one-handed snacks available (nursing takes up both hands)\n• Do not diet in the early weeks — your body needs fuel to heal\n• Eat regularly even if you do not feel hungry — blood sugar crashes worsen mood\n\nIf you are breastfeeding, avoid excessive caffeine (limit to 2 cups of coffee daily) and alcohol.',
    category: 'nutrition',
    relevantWeeks: { min: 0, max: 24 },
    deliveryType: 'all',
    forPartner: false,
    tags: ['nutrition', 'diet', 'breastfeeding', 'iron', 'recovery'],
    emoji: '🥗',
  },
  {
    id: 'pp_relationship_changes',
    title: 'Your Relationship After Baby',
    summary: 'How a new baby changes your relationship — and how to navigate it together.',
    body: 'Having a baby transforms your relationship. Even the strongest couples face new challenges during this time.\n\nCommon changes:\n• Less time for each other as individuals and as a couple\n• Different parenting styles emerging\n• Resentment over unequal workload (real or perceived)\n• Reduced physical intimacy\n• Communication becoming more transactional ("Did you feed the baby?")\n• Feeling like roommates rather than partners\n\nWhat helps:\n• Acknowledge that this is hard for BOTH of you\n• Express appreciation — even small things like "Thank you for getting up"\n• Have regular check-ins: "How are you? How are WE?"\n• Share the mental load, not just physical tasks\n• Avoid scorekeeping — it breeds resentment\n• Accept "good enough" rather than perfection\n• Physical touch does not have to mean sex — hold hands, hug, sit close\n\nAbout intimacy:\n• Most doctors recommend waiting 6 weeks before intercourse\n• Desire may be low for months — this is normal and hormonal\n• Breastfeeding further reduces libido due to low estrogen\n• Communication is everything: talk about needs, fears, and boundaries\n• Reconnection happens gradually, not overnight\n\nIf you are struggling as a couple, couples counselling can be incredibly helpful — and it is not a sign of failure.',
    category: 'relationships',
    relevantWeeks: { min: 0, max: 52 },
    deliveryType: 'all',
    forPartner: true,
    tags: ['relationship', 'intimacy', 'communication', 'partner'],
    emoji: '💑',
  },
  {
    id: 'pp_partner_postpartum_role',
    title: 'For Partners: Your Role in Postpartum',
    summary: 'How partners can meaningfully support recovery and bonding.',
    body: 'As a partner, you play a crucial role in postpartum recovery — both practically and emotionally.\n\nPractical support:\n• Handle meals, cleaning, laundry, and groceries\n• Manage visitors — be the gatekeeper so she can rest\n• Learn to settle the baby — rock, swaddle, walk, sing\n• Change nappies, do bath time, handle burping\n• Drive to medical appointments\n• Pick up prescriptions and supplies\n\nEmotional support:\n• Ask "How are you feeling?" and really listen\n• Do not dismiss her emotions or attribute them to hormones\n• Validate her experience: "This is really hard, and you are doing amazingly"\n• Be patient with mood swings — they are biochemical, not personal\n• Encourage her to connect with friends or support groups\n• Watch for signs of postpartum depression — you may notice before she does\n\nTake care of yourself too:\n• Sleep when you can\n• Talk to someone about YOUR feelings\n• Accept that life looks different now — this phase is temporary\n• Paternal postnatal depression is real — seek help if you need it\n\nBonding with baby:\n• Skin-to-skin contact is not just for mums — do it too\n• Talk, read, and sing to your baby\n• Take solo walks with the baby to give mum a break\n• Your bond develops through time and care, not instantly',
    category: 'relationships',
    relevantWeeks: { min: 0, max: 24 },
    deliveryType: 'all',
    forPartner: true,
    tags: ['partner', 'support', 'bonding', 'practical help'],
    emoji: '🤝',
  },
  {
    id: 'pp_csection_emotional',
    title: 'Emotions After a C-Section',
    summary: 'Processing feelings about your birth experience.',
    body: 'Many mothers have complex feelings after a caesarean birth, especially if it was unplanned or emergency.\n\nCommon emotions:\n• Relief that baby arrived safely\n• Disappointment about not having a vaginal birth\n• Grief for the birth experience you imagined\n• Guilt for feeling disappointed when the baby is healthy\n• Feeling "less than" or that your body "failed"\n• Trauma responses if the surgery was an emergency\n\nThese feelings are valid:\n• Having a healthy baby does not cancel out your feelings about the birth\n• You are allowed to grieve the experience you wanted\n• A C-section IS giving birth — it is not "the easy way out"\n• Your body did not fail — it grew a human being\n\nWhat helps:\n• Talk about your birth experience — with your partner, a friend, or a therapist\n• Write down your birth story when you feel ready\n• Ask your doctor to explain what happened and why\n• Connect with other C-section mothers\n• Be gentle with yourself about recovery timelines — surgery takes longer to heal\n\nIf you are experiencing flashbacks, nightmares, or extreme distress about the birth, this may be birth trauma. Please speak to a mental health professional.',
    category: 'emotional',
    relevantWeeks: { min: 0, max: 24 },
    deliveryType: 'c_section',
    forPartner: true,
    tags: ['c-section', 'emotions', 'grief', 'trauma', 'mental health'],
    emoji: '💜',
  },
  {
    id: 'pp_exercise_return',
    title: 'Returning to Exercise After Birth',
    summary: 'Safe guidelines for getting active again postpartum.',
    body: 'Returning to exercise postpartum should be gradual and guided by your body, not social media timelines.\n\nVaginal birth:\n• Weeks 0–2: Gentle walking and pelvic floor exercises only\n• Weeks 2–6: Gradually increase walking distance. Gentle stretching.\n• After 6-week checkup: Light exercise — yoga, swimming, low-impact cardio\n• 3+ months: Gradually return to higher intensity if cleared\n\nC-section:\n• Weeks 0–4: Very gentle walking only. No abdominal exercises.\n• Weeks 4–6: Gentle walks increasing in length. Pelvic floor exercises.\n• After 6-week checkup: Light exercise if doctor approves\n• 3–6 months: Gradual return to normal exercise. Core rehabilitation is key.\n\nWarning signs to stop and see your doctor:\n• Pain (not just discomfort)\n• Increased bleeding\n• Feeling of heaviness in the pelvis\n• Leaking urine during exercise\n\nImportant:\n• Do NOT do sit-ups or crunches until checked for diastasis recti\n• A postnatal physiotherapist can create a safe return-to-exercise plan\n• Comparison is the thief of joy — your timeline is yours\n• Your body grew and birthed a human — treat it with respect',
    category: 'exercise',
    relevantWeeks: { min: 2, max: 52 },
    deliveryType: 'all',
    forPartner: false,
    tags: ['exercise', 'fitness', 'walking', 'core', 'diastasis recti'],
    emoji: '🏃‍♀️',
  },
  {
    id: 'pp_hair_loss',
    title: 'Postpartum Hair Loss',
    summary: 'Why your hair is falling out and when it stops.',
    body: 'Around 3–6 months postpartum, many women experience significant hair shedding. This can be alarming but is completely normal.\n\nWhy it happens:\n• During pregnancy, high estrogen levels keep hair in the growth phase — you lose less hair than usual.\n• After birth, estrogen drops dramatically, and all that "extra" hair enters the shedding phase at once.\n• This is called telogen effluvium.\n\nWhat to expect:\n• Hair may come out in clumps, especially when washing or brushing\n• You might notice thinning, especially around the hairline and temples\n• It typically peaks at 3–4 months postpartum\n• Regrowth usually begins by 6 months\n• Full recovery of hair thickness takes 6–12 months\n\nWhat helps:\n• Gentle hair care — wide-tooth comb, loose hairstyles\n• Good nutrition — protein, iron, biotin, zinc\n• Volumizing shampoo and conditioner\n• A shorter hairstyle can make thinning less noticeable\n\nWhen to see your doctor:\n• If hair loss continues beyond 12 months\n• If you notice bald patches (rather than overall thinning)\n• These may indicate thyroid issues, which are common postpartum',
    category: 'physical',
    relevantWeeks: { min: 8, max: 52 },
    deliveryType: 'all',
    forPartner: false,
    tags: ['hair loss', 'telogen effluvium', 'hormones', 'shedding'],
    emoji: '💇',
  },
  {
    id: 'pp_six_week_checkup',
    title: 'Your 6-Week Postpartum Checkup',
    summary: 'What happens at this appointment and what to ask.',
    body: 'The 6-week postpartum checkup is an important milestone. It is your chance to discuss your physical and emotional recovery.\n\nWhat your doctor will check:\n• Healing of any tears, stitches, or C-section incision\n• Uterus size — it should be returning to pre-pregnancy size\n• Blood pressure\n• Weight\n• Breast health\n• Emotional wellbeing — screening for PPD/PPA\n• Contraception discussion\n\nQuestions to ask:\n• "When can I return to exercise?"\n• "Is my healing on track?"\n• "I have been feeling [symptom] — is this normal?"\n• "I have been feeling sad/anxious — can we discuss this?"\n• "When is it safe to have sex again?"\n• "Do I need any blood tests?" (thyroid, iron levels)\n• "Should I see a pelvic floor physiotherapist?"\n\nPrepare for this appointment:\n• Write down your questions beforehand\n• Be honest about how you are really feeling\n• Mention any ongoing pain, bleeding, or mood issues\n• Bring your partner if you want support\n\nThis appointment is about YOU, not just baby. Use it.',
    category: 'physical',
    relevantWeeks: { min: 4, max: 8 },
    deliveryType: 'all',
    forPartner: true,
    tags: ['checkup', 'doctor', '6 weeks', 'questions', 'recovery'],
    emoji: '🏥',
  },
];

export function getRelevantArticles(
  weeksPostpartum: number,
  deliveryType: 'vaginal' | 'c_section' | 'vbac',
  includePartner: boolean = false,
): PostpartumArticle[] {
  const effectiveType = deliveryType === 'vbac' ? 'vaginal' : deliveryType;
  
  return POSTPARTUM_ARTICLES.filter(article => {
    const weekMatch = weeksPostpartum >= article.relevantWeeks.min && weeksPostpartum <= article.relevantWeeks.max;
    const typeMatch = article.deliveryType === 'all' || article.deliveryType === effectiveType;
    const partnerMatch = includePartner || !article.forPartner || article.forPartner;
    return weekMatch && typeMatch && partnerMatch;
  }).sort((a, b) => {
    const aRelevance = Math.abs(weeksPostpartum - (a.relevantWeeks.min + a.relevantWeeks.max) / 2);
    const bRelevance = Math.abs(weeksPostpartum - (b.relevantWeeks.min + b.relevantWeeks.max) / 2);
    return aRelevance - bRelevance;
  });
}

export function getPartnerArticles(weeksPostpartum: number): PostpartumArticle[] {
  return POSTPARTUM_ARTICLES.filter(article => {
    const weekMatch = weeksPostpartum >= article.relevantWeeks.min && weeksPostpartum <= article.relevantWeeks.max;
    return weekMatch && article.forPartner;
  });
}
