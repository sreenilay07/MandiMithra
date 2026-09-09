const Token = require('../../models/Token');
const Procurement = require('../../models/Procurement');
const ProcurementStage = require('../../models/ProcurementStage');
const ProcurementCentre = require('../../models/ProcurementCentre');
const queueService = require('../queue/queue.service');

const FAQ_DATABASE = {
  en: [
    {
      intent: 'DOCUMENTS',
      keywords: ['document', 'bring', 'carry', 'aadhaar', 'passbook'],
      answer: 'Please bring your Aadhaar Card, Bank Passbook, Land Passbook, and Booking Token QR code.'
    },
    {
      intent: 'DEPARTURE',
      keywords: ['leave', 'travel', 'when to start', 'departure'],
      answer: 'Please check your departure recommendation on the queue screen. Leave such that you arrive 15 minutes before your estimated turn time.'
    },
    {
      intent: 'STAGES',
      keywords: ['stage', 'process', 'step', 'workflow', 'after weight'],
      answer: 'The 7 procurement stages are: 1. Maturity Test, 2. Bags Allocation, 3. Bags Filling, 4. Bags Stitching, 5. Weight, 6. Loading to Lorry, and 7. Documents Submission.'
    },
    {
      intent: 'PAYMENT',
      keywords: ['payment', 'money', 'bank', 'transfer', 'credit'],
      answer: 'Payment status is automatically updated after Stage 7 (Documents Submission) is completed. You can view payment updates in the Payments tab.'
    }
  ],
  te: [
    {
      intent: 'DOCUMENTS',
      keywords: ['పత్రాలు', 'ఆధార్', 'పాస్ బుక్', 'కాగితాలు'],
      answer: 'దయచేసి మీ ఆధార్ కార్డ్, బ్యాంక్ పాస్‌బుక్, పట్టాదార్ పాస్‌బుక్ మరియు టోకెన్ QR కోడ్‌ను తీసుకెళ్లండి.'
    },
    {
      intent: 'DEPARTURE',
      keywords: ['ఎప్పుడు', 'బయలుదేరాలి', 'సమయం'],
      answer: 'మీ అంచనా వేసిన వంతు సమయానికి 15 నిమిషాల ముందు చేరుకునేలా ఇంటి నుండి బయలుదేరండి.'
    },
    {
      intent: 'STAGES',
      keywords: ['దశలు', 'ప్రక్రియ', 'తర్వాత'],
      answer: '7 సేకరణ దశలు: 1. నాణ్యత పరీక్ష, 2. సంచుల కేటాయింపు, 3. సంచుల నింపడం, 4. కుట్టు వేయడం, 5. తూకం, 6. లారీ ఎక్కించడం, 7. పత్రాల సమర్పణ.'
    }
  ],
  hi: [
    {
      intent: 'DOCUMENTS',
      keywords: ['दस्तावेज', 'कागज', 'आधार', 'पासबुक'],
      answer: 'कृपया अपना आधार कार्ड, बैंक पासबुक, भूमि पासबुक और बुकिंग टोकन QR कोड साथ लाएं।'
    },
    {
      intent: 'DEPARTURE',
      keywords: ['कब निकलना', 'समय', 'यात्रा'],
      answer: 'कृपया अपने अनुमानित समय से 15 मिनट पहले केंद्र पहुंचने के लिए घर से निकलें।'
    },
    {
      intent: 'STAGES',
      keywords: ['चरण', 'प्रक्रिया', 'कदम'],
      answer: '7 खरीद चरण: 1. गुणवत्ता परीक्षण, 2. बोरा आवंटन, 3. बोरा भरना, 4. सिलाई, 5. वजन, 6. ट्रक लोडिंग, 7. दस्तावेज जमा।'
    }
  ]
};

class ChatbotService {
  getFaqs(lang = 'en') {
    return FAQ_DATABASE[lang] || FAQ_DATABASE.en;
  }

  async processMessage(user, message, lang = 'en') {
    const text = (message || '').toLowerCase();
    const activeLang = FAQ_DATABASE[lang] ? lang : 'en';

    // 1. Dynamic Query: Waiting Time / Token Query
    if (text.includes('wait') || text.includes('time') || text.includes('queue') || text.includes('వంతు') || text.includes('इंतजार')) {
      if (user && user._id) {
        const token = await Token.findOne({ farmerId: user._id, status: { $in: ['WAITING', 'ARRIVED', 'IN_PROGRESS'] } }).populate('centreId');
        if (token) {
          const centreName = token.centreId?.name || 'Procurement Centre';
          if (activeLang === 'te') {
            return `మీ టోకెన్ ${token.tokenNumber}. మీ ముందు ఉన్న రైతులు: ${token.queuePosition - 1}. అంచనా నిరీక్షణ సమయం: ${token.estimatedWaitingMinutes} నిమిషాలు (${centreName}).`;
          } else if (activeLang === 'hi') {
            return `आपका टोकन ${token.tokenNumber} है। आपसे आगे ${token.queuePosition - 1} किसान हैं। अनुमानित प्रतीक्षा समय: ${token.estimatedWaitingMinutes} मिनट।`;
          }
          return `Your active token is ${token.tokenNumber} at ${centreName}. Queue position: #${token.queuePosition}. Estimated waiting time: ${token.estimatedWaitingMinutes} mins.`;
        }
      }
    }

    // 2. Dynamic Query: Procurement Stage
    if (text.includes('stage') || text.includes('status') || text.includes('దశ') || text.includes('स्थिति')) {
      if (user && user._id) {
        const proc = await Procurement.findOne({ farmerId: user._id, status: { $in: ['ARRIVED', 'IN_PROGRESS'] } });
        if (proc) {
          const currentStage = await ProcurementStage.findOne({ procurementId: proc._id, status: 'IN_PROGRESS' });
          const stageName = currentStage ? currentStage.stageName : 'Initial Verification';
          if (activeLang === 'te') {
            return `మీ ధాన్యం సేకరణ ప్రస్తుతం "${stageName}" దశలో ఉంది.`;
          } else if (activeLang === 'hi') {
            return `आपकी खरीद वर्तमान में "${stageName}" चरण में है।`;
          }
          return `Your procurement is currently in progress at Stage: "${stageName}".`;
        }
      }
    }

    // 3. Keyword Match in FAQ Database
    const faqs = FAQ_DATABASE[activeLang] || FAQ_DATABASE.en;
    for (const faq of faqs) {
      if (faq.keywords.some(kw => text.includes(kw))) {
        return faq.answer;
      }
    }

    // Fallback response
    if (activeLang === 'te') {
      return 'క్షమించండి, మీ ప్రశ్నకు సమాధానం దొరకలేదు. దయచేసి పత్రాలు, నిరీక్షణ సమయం లేదా సేకరణ దశల గురించి అడగండి.';
    } else if (activeLang === 'hi') {
      return 'क्षमा करें, मुझे समझ नहीं आया। कृपया दस्तावेज, प्रतीक्षा समय या खरीद चरणों के बारे में पूछें।';
    }
    return "I couldn't find an exact answer. You can ask about required documents, waiting time, procurement stages, or payment status.";
  }
}

module.exports = new ChatbotService();
