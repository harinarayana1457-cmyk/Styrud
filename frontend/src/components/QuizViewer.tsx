import React, { useState, useEffect } from 'react';
import { HelpCircle, ChevronLeft, Award } from 'lucide-react';

interface Question {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

interface QuizViewerProps {
  assetId: string | null;
  onBack: () => void;
}

export default function QuizViewer({ assetId, onBack }: QuizViewerProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [answersList, setAnswersList] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = assetId ? `/api/generate/quiz?asset_id=${assetId}` : '/api/generate/quiz';
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to generate quiz.");
        const data = await res.json();
        setQuestions(data.quiz || []);
      } catch (err: any) {
        setError(err.message || "Error building quiz.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [assetId]);

  const handleOptionSelect = (optionIdx: number) => {
    if (submitted) return;
    const letter = chr(65 + optionIdx);
    setSelectedAnswer(letter);
  };

  const chr = (code: number) => String.fromCharCode(code);

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || submitted) return;
    setSubmitted(true);
    
    const isCorrect = selectedAnswer === questions[currentIdx].answer;
    if (isCorrect) setScore(prev => prev + 1);
    
    const newAnswers = [...answersList];
    newAnswers[currentIdx] = selectedAnswer;
    setAnswersList(newAnswers);
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setSubmitted(false);
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setSubmitted(false);
    setScore(0);
    setAnswersList([]);
    setFinished(false);
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full py-2">
      <button 
        onClick={onBack}
        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-555 hover:text-white transition duration-300 w-fit"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Styrud
      </button>

      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-405 animate-bounce" />
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Active Evaluation</h2>
            <p className="text-[10px] text-zinc-500 mt-0.5 font-semibold">Verify structural retention of notes</p>
          </div>
        </div>
        {!finished && questions.length > 0 && (
          <div className="text-[10px] text-zinc-500 font-mono">
            {currentIdx + 1} / {questions.length}
          </div>
        )}
      </div>

      {loading ? (
        <div className="bg-styrud-panel border border-white/[0.06] rounded-3xl h-[350px] flex flex-col items-center justify-center text-zinc-500 gap-3 shadow-xl">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-300">Drafting Questions...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl text-zinc-400 text-xs">
          {error}
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-styrud-panel border border-white/[0.06] rounded-3xl h-[350px] flex items-center justify-center text-zinc-500 shadow-xl text-xs uppercase tracking-wider font-bold">
          No questions generated
        </div>
      ) : finished ? (
        <div className="bg-styrud-panel border border-white/[0.06] rounded-3xl p-8 flex flex-col items-center text-center shadow-xl gap-5 animate-float">
          <Award className="w-12 h-12 text-yellow-450 animate-bounce" />
          <div>
            <h3 className="text-lg font-bold text-white mb-1 uppercase tracking-wider">Evaluation Completed</h3>
            <p className="text-[10px] text-zinc-500">Your score outcome breakdown:</p>
            <div className="mt-4 text-3xl font-extrabold text-white">
              {score} / {questions.length}
            </div>
            <p className="text-[10px] text-zinc-650 mt-1 font-mono">
              ({((score / questions.length) * 100).toFixed(0)}% accuracy rate)
            </p>
          </div>

          <button
            onClick={handleRestart}
            className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 hover:scale-[1.03] active:scale-95 text-white rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-lg hover:shadow-red-500/10"
          >
            Retake Quiz
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          
          {/* Question Box */}
          <div className="bg-styrud-panel border border-white/[0.06] rounded-3xl p-6 shadow-xl flex flex-col gap-5">
            <h3 className="text-sm md:text-base font-bold text-zinc-200 leading-relaxed uppercase tracking-wider">
              {questions[currentIdx].question}
            </h3>

            {/* Options */}
            <div className="flex flex-col gap-2.5">
              {questions[currentIdx].options.map((opt, oIdx) => {
                const letter = chr(65 + oIdx);
                const isSelected = selectedAnswer === letter;
                const isCorrect = letter === questions[currentIdx].answer;
                
                let optStyle = 'border-white/10 bg-transparent text-zinc-350 hover:border-white/20';
                
                if (submitted) {
                  if (isCorrect) {
                    optStyle = 'border-lime-500 bg-lime-500/[0.05] text-lime-200 shadow-[0_0_15px_rgba(132,204,22,0.15)]';
                  } else if (isSelected) {
                    optStyle = 'border-red-500 bg-red-500/[0.05] text-rose-200 shadow-[0_0_15px_rgba(239,68,68,0.15)]';
                  } else {
                    optStyle = 'border-white/[0.03] text-zinc-650 opacity-40';
                  }
                } else if (isSelected) {
                  optStyle = 'border-indigo-500 bg-indigo-500/[0.05] text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]';
                }

                return (
                  <div
                    key={oIdx}
                    onClick={() => handleOptionSelect(oIdx)}
                    className={`p-4 border rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-between text-xs font-bold tracking-wider ${optStyle}`}
                  >
                    <span>{opt}</span>
                    <span className="text-[9px] bg-styrud-dark px-2.5 py-1 border border-white/5 rounded-full font-mono font-bold shrink-0 select-none text-zinc-400">
                      {letter}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Explanation box */}
            {submitted && (
              <div className={`p-4 rounded-2xl border flex gap-3 ${
                selectedAnswer === questions[currentIdx].answer 
                  ? 'border-lime-500/25 bg-lime-500/[0.01] text-lime-300'
                  : 'border-red-500/25 bg-red-500/[0.01] text-rose-300'
              }`}>
                <div>
                  <h4 className="font-bold text-[9px] uppercase tracking-widest mb-1.5">
                    {selectedAnswer === questions[currentIdx].answer ? 'Verification Correct' : 'Verification Mismatch'}
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed font-medium">{questions[currentIdx].explanation}</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end">
            {!submitted ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer}
                className={`px-6 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 active:scale-95 shadow ${
                  !selectedAnswer ? 'opacity-40 cursor-not-allowed' : ''
                }`}
              >
                Submit Response
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 active:scale-95 shadow flex items-center gap-1"
              >
                {currentIdx < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
