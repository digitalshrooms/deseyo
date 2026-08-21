import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  QuestionnaireAnswers,
  evaluateQuestionnaire,
  QUESTIONNAIRE_QUESTIONS,
  OPTIONAL_QUESTIONS,
} from '../services/questionnaireLogic';

export const OnboardingQuestionnaire = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuestionnaireAnswers>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOptional, setShowOptional] = useState(false);

  const totalRequired = QUESTIONNAIRE_QUESTIONS.length;
  const totalOptional = OPTIONAL_QUESTIONS.length;
  const allQuestions = showOptional
    ? [...QUESTIONNAIRE_QUESTIONS, ...OPTIONAL_QUESTIONS]
    : QUESTIONNAIRE_QUESTIONS;

  const currentQuestion = allQuestions[currentStep];
  const isLastRequiredQuestion = currentStep === totalRequired - 1;
  const isLastQuestion = currentStep === allQuestions.length - 1;

  const handleAnswer = async (questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    setTimeout(async () => {
      if (isLastRequiredQuestion && !showOptional) {
        setShowOptional(true);
        setCurrentStep(currentStep + 1);
      } else if (isLastQuestion) {
        await handleSubmit(newAnswers as QuestionnaireAnswers);
      } else {
        setCurrentStep(currentStep + 1);
      }
    }, 200);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (finalAnswers?: QuestionnaireAnswers) => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      const result = evaluateQuestionnaire(finalAnswers || (answers as QuestionnaireAnswers));

      const { error: responseError } = await supabase
        .from('onboarding_responses')
        .upsert(
          {
            user_id: user.id,
            ...(finalAnswers || answers),
            ...result,
          },
          { onConflict: 'user_id' }
        );

      if (responseError) {
        console.error('onboarding_responses upsert error:', responseError);
        throw responseError;
      }

      const ans = (finalAnswers || answers) as QuestionnaireAnswers;
      const planTag: 'RESTART' | 'DESEYO' = result.recommended_plan === 'Restart' ? 'RESTART' : 'DESEYO';
      const levelTag: 'L1' | 'L2' = result.recommended_plan === 'L2' ? 'L2' : 'L1';
      const primaryPriorityTag: 'BODY' | 'FACE' = result.face_priority ? 'FACE' : 'BODY';

      const areaMap: Record<string, string> = {
        '1': 'AREA_SPINE',
        '2': 'AREA_NECK_SHOULDER',
        '3': 'AREA_HIP',
        '6': 'AREA_CORE',
        '7': 'AREA_FULL_BODY',
      };
      const bodyAreaTag = areaMap[ans.q5_focus_area] || 'AREA_FULL_BODY';

      const { error: userError } = await supabase
        .from('users')
        .update({
          onboarding_completed: true,
          current_plan: result.recommended_plan,
          current_day: 1,
          current_week: 1,
          plan_start_date: new Date().toISOString(),
          plan_tag: planTag,
          level_tag: levelTag,
          primary_priority_tag: primaryPriorityTag,
          body_area_tag: bodyAreaTag,
          high_capacity_candidate: result.high_capacity_candidate,
          onboarding_day_index: 1,
          q6_best_time: ans.q6_best_time,
          q8_email_pref: ans.q8_email_pref,
        })
        .eq('id', user.id);

      if (userError) throw userError;

      // Refresh context so ProtectedRoute sees onboarding_completed=true immediately
      await refreshUser();
      console.log('[Questionnaire] Saved successfully, navigating to result');
      navigate(`/onboarding-result?plan=${result.recommended_plan}`);
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
      alert('Nastala chyba při ukládání dotazníku. Zkuste to prosím znovu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((currentStep + 1) / allQuestions.length) * 100;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id as keyof QuestionnaireAnswers] : null;

  if (!currentQuestion) {
    return null;
  }

  const stepLabel = showOptional && currentStep >= totalRequired
    ? `Otázka ${currentStep - totalRequired + 1} z ${totalOptional}`
    : `Otázka ${currentStep + 1} z ${totalRequired}`;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col pt-8 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto w-full h-full flex flex-col">
          {showOptional && currentStep === totalRequired && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-8 text-center">
              <p className="text-teal-900 text-sm font-medium">
                Ještě 3 krátké otázky navíc. Pomůžou nám dělat platformu líp.
              </p>
            </div>
          )}

          <div className="flex-shrink-0">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight h-[5.5rem]">
              {currentQuestion.question}
            </h1>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mt-6">
              <div
                className="h-full bg-teal-600 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs font-medium text-gray-500 mt-3 mb-8">{stepLabel}</p>
          </div>

          <div className="flex-shrink-0 space-y-3 mb-8">
            {currentQuestion.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(currentQuestion.id, option.value)}
                className={`w-full text-left p-4 sm:p-5 rounded-xl border-2 transition-all duration-200 ${
                  currentAnswer === option.value
                    ? 'border-teal-600 bg-teal-50'
                    : 'border-gray-200 hover:border-teal-400 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-all duration-200 ${
                      currentAnswer === option.value
                        ? 'border-teal-600 bg-teal-600'
                        : 'border-gray-300'
                    }`}
                  >
                    {currentAnswer === option.value && (
                      <div className="w-2.5 h-2.5 bg-white rounded-full" />
                    )}
                  </div>
                  <span className={`text-base sm:text-lg font-medium transition-colors ${
                    currentAnswer === option.value
                      ? 'text-teal-900'
                      : 'text-gray-700'
                  }`}>
                    {option.label}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="flex-1" />

          <div className="flex-shrink-0 pb-8 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                currentStep === 0
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              Zpět
            </button>

            {showOptional && currentStep >= totalRequired && (
              <button
                onClick={async () => {
                  if (isLastQuestion) {
                    await handleSubmit();
                  } else {
                    setCurrentStep(currentStep + 1);
                  }
                }}
                className="px-6 py-3 rounded-lg font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-sm"
              >
                Přeskočit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
