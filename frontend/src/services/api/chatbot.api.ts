import { apiClient } from './apiClient';

export const chatbotApi = {
  getFaqs: async (lang?: string) => {
    const res = await apiClient.get('/chatbot/faqs', { params: { lang } });
    return res.data;
  },

  sendMessage: async (message: string, language?: string) => {
    const res = await apiClient.post('/chatbot/message', { message, language });
    return res.data;
  }
};
