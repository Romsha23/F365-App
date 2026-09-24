const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const pages = [
  ['login','/login'], ['welcome','/welcome'], ['onboarding','/onboarding'], ['subscription','/subscription'],
  ['home-tabs','/(tabs)'], ['log-entry','/log-entry'], ['edit-profile','/edit-profile'], ['emergency-contacts','/emergency-contacts'],
  ['help','/help'], ['reminders','/reminders'], ['data-export','/data-export'], ['consent','/consent'],
  ['partner-sharing','/partner-sharing'], ['partner-link','/partner-link'], ['partner-summary','/partner-summary'], ['partner-education','/partner-education'], ['relationship-dashboard','/relationship-dashboard'],
  ['privacy-policy','/privacy-policy'], ['terms-of-service','/terms-of-service'], ['subscription-management','/subscription-management'], ['subscription-success','/subscription-success'], ['redeem-code','/redeem-code'],
  ['symptom-checker','/symptom-checker'], ['telehealth','/telehealth'], ['book-appointment','/book-appointment'], ['my-appointments','/my-appointments'], ['consultation','/consultation'], ['ai-chatbot','/ai-chatbot'], ['advanced-analytics','/advanced-analytics'], ['ai-insights','/ai-insights'],
  ['pregnancy-dashboard','/pregnancy-dashboard'], ['pregnancy-setup','/pregnancy-setup'], ['pregnancy-calendar','/pregnancy-calendar'], ['pregnancy-log','/pregnancy-log'], ['kick-counter','/kick-counter'], ['contraction-timer','/contraction-timer'], ['pregnancy-appointments','/pregnancy-appointments'], ['baby-development','/baby-development'],
  ['postpartum-dashboard','/postpartum-dashboard'], ['postpartum-knowledge','/postpartum-knowledge'], ['postpartum-assessment','/postpartum-assessment'], ['secret-name-reveal','/secret-name-reveal'],
  ['fertility-predictions','/fertility-predictions'], ['pcos-insights','/pcos-insights'], ['ivf-assessment','/ivf-assessment'], ['ivf-results','/ivf-results'], ['clinic-finder','/clinic-finder'], ['clinic-detail','/clinic-detail'], ['clinic-consent','/clinic-consent'], ['fertility-pathway','/fertility-pathway'], ['cost-estimator','/cost-estimator'], ['ivf-roadmap','/ivf-roadmap'], ['doctor-questions','/doctor-questions'],
  ['perimenopause-dashboard','/perimenopause-dashboard'], ['perimenopause-symptoms','/perimenopause-symptoms'], ['perimenopause-education','/perimenopause-education'], ['reset-password','/reset-password']
];

(async () => {
  const outDir = path.resolve(__dirname, 'page-screenshots');
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  page.on('console', () => {});
  for (const [name, route] of pages) {
    try {
      const url = `http://127.0.0.1:8088${route}`;
      await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(2500);
      await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: false });
      console.log(`captured ${name}`);
    } catch (err) {
      console.log(`failed ${name}: ${err.message}`);
    }
  }
  await browser.close();
})();
