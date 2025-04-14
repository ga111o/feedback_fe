import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./App.css";

// Survey question types
type QuestionType =
  | "multiple_choice"
  | "text"
  | "rating"
  | "checkboxes"
  | "paragraph"
  | "short_answer";

// Interface for question options
interface QuestionOption {
  id: string;
  text: string;
}

// Interface for rating labels
interface RatingLabels {
  [key: number]: string;
}

// Interface for question data
interface Question {
  id: string;
  question_text: string;
  question_type: QuestionType;
  options?: QuestionOption[];
  order: number;
  is_required: boolean;
  rating_min?: number;
  rating_max?: number;
  rating_labels?: RatingLabels;
}

// Interface for user responses
interface SurveyResponses {
  [questionId: string]: string | string[] | number;
}

export default function Survey() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<SurveyResponses>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/surveys/${surveyId}/questions`
        );

        if (!response.ok) {
          throw new Error("설문 질문을 불러오는데 실패했습니다.");
        }

        const data = await response.json();
        setQuestions(data);
      } catch (error) {
        console.error("Error fetching questions:", error);
        setError("설문 질문을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    if (surveyId) {
      fetchQuestions();
    }
  }, [surveyId]);

  // Handle text input change
  const handleTextChange = (questionId: string, value: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Handle multiple choice selection
  const handleMultipleChoiceChange = (questionId: string, value: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Handle checkbox selection
  const handleCheckboxChange = (questionId: string, value: string) => {
    setResponses((prev) => {
      const currentSelections = (prev[questionId] as string[]) || [];
      const updatedSelections = currentSelections.includes(value)
        ? currentSelections.filter((item) => item !== value)
        : [...currentSelections, value];

      return {
        ...prev,
        [questionId]: updatedSelections,
      };
    });
  };

  // Handle rating selection
  const handleRatingChange = (questionId: string, value: number) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const renderQuestion = (question: Question) => {
    switch (question.question_type) {
      case "multiple_choice":
        return (
          <div className="question-options">
            {question.options?.map((option) => (
              <div key={option.id} className="option">
                <input
                  type="radio"
                  id={`${question.id}-${option.id}`}
                  name={question.id}
                  value={option.text}
                  checked={(responses[question.id] as string) === option.text}
                  onChange={() =>
                    handleMultipleChoiceChange(question.id, option.text)
                  }
                  required={question.is_required}
                />
                <label htmlFor={`${question.id}-${option.id}`}>
                  {option.text}
                </label>
              </div>
            ))}
          </div>
        );

      case "checkboxes":
        return (
          <div className="question-options">
            {question.options?.map((option) => (
              <div key={option.id} className="option">
                <input
                  type="checkbox"
                  id={`${question.id}-${option.id}`}
                  name={question.id}
                  value={option.text}
                  checked={(
                    (responses[question.id] as string[]) || []
                  ).includes(option.text)}
                  onChange={() =>
                    handleCheckboxChange(question.id, option.text)
                  }
                />
                <label htmlFor={`${question.id}-${option.id}`}>
                  {option.text}
                </label>
              </div>
            ))}
          </div>
        );

      case "text":
      case "short_answer":
        return (
          <input
            type="text"
            value={(responses[question.id] as string) || ""}
            onChange={(e) => handleTextChange(question.id, e.target.value)}
            className="text-input"
            required={question.is_required}
          />
        );

      case "paragraph":
        return (
          <textarea
            value={(responses[question.id] as string) || ""}
            onChange={(e) => handleTextChange(question.id, e.target.value)}
            className="textarea-input"
            rows={5}
            required={question.is_required}
          />
        );

      case "rating":
        const ratingMin = question.rating_min || 1;
        const ratingMax = question.rating_max || 5;
        return (
          <div className="rating-container">
            {Array.from(
              { length: ratingMax - ratingMin + 1 },
              (_, i) => ratingMin + i
            ).map((value) => (
              <div key={value} className="rating-option">
                <input
                  type="radio"
                  id={`${question.id}-rating-${value}`}
                  name={question.id}
                  value={value}
                  checked={(responses[question.id] as number) === value}
                  onChange={() => handleRatingChange(question.id, value)}
                  required={question.is_required}
                />
                <label htmlFor={`${question.id}-rating-${value}`}>
                  {value}
                  <div className="rating-label">
                    {question.rating_labels?.[value] || ""}
                  </div>
                </label>
              </div>
            ))}
          </div>
        );

      default:
        return <p>지원하지 않는 질문 유형입니다.</p>;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      // Collect system information
      const systemInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        browserName: getBrowserName(),
        deviceType: getDeviceType(),
      };

      const payload = {
        respondent_id: JSON.stringify(systemInfo),
        answers: responses,
      };
      console.log(payload);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/surveys/${surveyId}/responses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "설문 제출에 실패했습니다.");
      }

      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting survey:", error);
      setSubmitError(
        error instanceof Error ? error.message : "설문 제출에 실패했습니다."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to detect browser name
  const getBrowserName = () => {
    const userAgent = navigator.userAgent;
    let browserName = "Unknown";

    if (userAgent.indexOf("Firefox") > -1) {
      browserName = "Firefox";
    } else if (userAgent.indexOf("SamsungBrowser") > -1) {
      browserName = "Samsung Browser";
    } else if (
      userAgent.indexOf("Opera") > -1 ||
      userAgent.indexOf("OPR") > -1
    ) {
      browserName = "Opera";
    } else if (userAgent.indexOf("Edge") > -1) {
      browserName = "Edge";
    } else if (userAgent.indexOf("Chrome") > -1) {
      browserName = "Chrome";
    } else if (userAgent.indexOf("Safari") > -1) {
      browserName = "Safari";
    }

    return browserName;
  };

  // Helper function to detect device type
  const getDeviceType = () => {
    const userAgent = navigator.userAgent;
    if (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent
      )
    ) {
      return "Mobile";
    }
    return "Desktop";
  };

  if (loading) return <div className="loading">로딩 중...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="survey-container">
      <h1>설문조사</h1>

      {submitted ? (
        <div className="success-message">
          <h2>설문이 성공적으로 제출되었습니다.</h2>
          <p>참여해주셔서 감사합니다.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {questions.map((question) => (
            <div key={question.id} className="question-card">
              <h3>
                {question.question_text}
                {question.is_required && <span className="required">*</span>}
              </h3>
              {renderQuestion(question)}
            </div>
          ))}

          {submitError && <div className="error">{submitError}</div>}

          {questions.length > 0 && (
            <button
              type="submit"
              className="submit-button"
              disabled={submitting}
            >
              {submitting ? "제출 중..." : "제출하기"}
            </button>
          )}

          {questions.length === 0 && (
            <p className="no-questions">해당 설문에 등록된 질문이 없습니다.</p>
          )}
        </form>
      )}
    </div>
  );
}
