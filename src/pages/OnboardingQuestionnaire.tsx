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
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="absolute top-0 -left-40 w-96 h-96 rounded-full blur-3xl opacity-[0.08] pointer-events-none" style={{ backgroundColor: 'var(--primary)' }} />
      <div className="absolute bottom-0 -right-32 w-80 h-80 rounded-full blur-3xl opacity-[0.08] pointer-events-none" style={{ backgroundColor: 'var(--primary)' }} />

      <div className="relative z-10 flex-1 flex flex-col pt-8 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto w-full h-full flex flex-col">
          {showOptional && currentStep === totalRequired && (
            <div className="rounded-xl p-4 mb-8 text-center" style={{ backgroundColor: 'var(--primary-soft)', border: '1px solid var(--primary)' }}>
              <p className="text-sm" style={{ color: 'var(--primary-dark)' }}>
                Ještě 3 krátké otázky navíc. Pomůžou nám dělat platformu líp.
              </p>
            </div>
          )}

          <div className="flex-shrink-0">
            <h1 className="font-normal leading-tight h-[5.5rem]" style={{ fontSize: 'clamp(26px, 5vw, 36px)', color: 'var(--text)' }}>
              {currentQuestion.question}
            </h1>
            <div className="h-1.5 rounded-full overflow-hidden mt-6" style={{ backgroundColor: 'var(--border)' }}>
              <div
                className="h-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%`, backgroundColor: 'var(--primary)' }}
              />
            </div>
            <p className="text-xs mt-3 mb-8" style={{ color: 'var(--text-subtle)' }}>{stepLabel}</p>
          </div>

          <div className="flex-shrink-0 space-y-3 mb-8">
            {currentQuestion.options.map((option) => {
              const selected = currentAnswer === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(currentQuestion.id, option.value)}
                  className="w-full text-left p-4 sm:p-5 rounded-xl transition-all duration-200"
                  style={{
                    border: `1.5px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                    backgroundColor: selected ? 'var(--primary-soft)' : 'var(--bg-card)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 transition-all duration-200"
                      style={{
                        border: `2px solid ${selected ? 'var(--primary)' : 'var(--text-subtle)'}`,
                        backgroundColor: selected ? 'var(--primary)' : 'transparent',
                      }}
                    >
                      {selected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                    </div>
                    <span
                      className="text-base sm:text-lg font-normal transition-colors"
                      style={{ color: selected ? 'var(--primary-dark)' : 'var(--text)' }}
                    >
                      {option.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex-1" />

          <div className="flex-shrink-0 pb-8 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-normal transition-colors hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: 'var(--text-muted)' }}
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
                className="px-6 py-3 rounded-xl font-normal text-sm transition-colors hover:opacity-80"
                style={{ color: 'var(--text-subtle)' }}
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
