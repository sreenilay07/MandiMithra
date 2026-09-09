const express = require('express');
const asyncWrapper = require('../utils/asyncWrapper');
const { sendSuccess } = require('../utils/responseHandler');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { chatbotMessageSchema } = require('../validators/schemas');
const chatbotService = require('../services/chatbot/chatbot.service');

const router = express.Router();

router.use(protect);

/**
 * @route GET /api/v1/chatbot/faqs
 * @desc Get list of predefined FAQs for user language
 */
router.get('/faqs', asyncWrapper(async (req, res) => {
  const lang = req.query.lang || req.user.language || 'en';
  const faqs = chatbotService.getFaqs(lang);
  return sendSuccess(res, 'FAQs retrieved', faqs);
}));

/**
 * @route POST /api/v1/chatbot/message
 * @desc Send question to rule-based multilingual chatbot engine
 */
router.post('/message', validate(chatbotMessageSchema), asyncWrapper(async (req, res) => {
  const { message, language } = req.body;
  const userLang = language || req.user.language || 'en';

  const reply = await chatbotService.processMessage(req.user, message, userLang);

  return sendSuccess(res, 'Chatbot response generated', {
    userMessage: message,
    language: userLang,
    reply
  });
}));

module.exports = router;
