export type TestUiLang = 'en' | 'hi';

export const getStoredTestUiLang = (): TestUiLang => {
  const lang = localStorage.getItem('testUiLang');
  return lang === 'hi' ? 'hi' : 'en';
};

export const setStoredTestUiLang = (lang: TestUiLang) => {
  localStorage.setItem('testUiLang', lang);
};

export const testUiStrings = {
  en: {
    preparing: 'Preparing test...',
    noQuestions: 'No questions available for this test.',
    backDashboard: 'Back to Dashboard',
    question: 'Question',
    of: 'of',
    marksLine: (marks: number, negative: number) => `Marks: +${marks} / -${negative}`,
    previous: 'Previous',
    submitting: 'Submitting...',
    submitTest: 'Submit Test',
    next: 'Next',
    navigation: 'Navigation',
    answered: 'Answered',
    remaining: 'Remaining',
    percentComplete: (percent: number) => `${percent}% Complete`,
    tipRefresh: 'Do not refresh this page. Your progress will be lost.',
    submitTitle: 'Submit Test',
    submitBody: (answered: number, total: number, remaining: number) => `You have answered ${answered} out of ${total} questions. There are ${remaining} questions remaining. Are you sure you want to submit?`,
    goBack: 'Go Back',
    confirmSubmit: 'Confirm Submit',
  },
  hi: {
    preparing: 'टेस्ट तैयार हो रहा है...',
    noQuestions: 'इस टेस्ट के लिए कोई प्रश्न उपलब्ध नहीं हैं।',
    backDashboard: 'डैशबोर्ड पर वापस जाएं',
    question: 'प्रश्न',
    of: 'कुल',
    marksLine: (marks: number, negative: number) => `अंक: +${marks} / -${negative}`,
    previous: 'पिछला',
    submitting: 'जमा किया जा रहा है...',
    submitTest: 'टेस्ट जमा करें',
    next: 'अगला',
    navigation: 'नेविगेशन',
    answered: 'उत्तर दिए गए',
    remaining: 'शेष',
    percentComplete: (percent: number) => `${percent}% पूर्ण`,
    tipRefresh: 'इस पृष्ठ को रीफ्रेश न करें। आपकी प्रगति नष्ट हो जाएगी।',
    submitTitle: 'टेस्ट जमा करें',
    submitBody: (answered: number, total: number, remaining: number) => `आपने ${total} में से ${answered} प्रश्नों के उत्तर दिए हैं। ${remaining} प्रश्न शेष हैं। क्या आप निश्चित रूप से जमा करना चाहते हैं?`,
    goBack: 'वापस जाएं',
    confirmSubmit: 'जमा करने की पुष्टि करें',
  }
};
