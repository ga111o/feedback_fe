import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./App.css";
import "./Survey.css";

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
  id?: string;
  text?: string;
  value?: string;
  label?: string;
}

// Interface for rating labels
interface RatingLabels {
  [key: number]: string;
}

// Interface for section
interface Section {
  id: number;
  name: string;
}

// Interface for question data
interface Question {
  id: string;
  question_text: string;
  question_type: QuestionType;
  options?: QuestionOption[];
  order: number;
  is_required: boolean;
  section_id?: { [key: number]: string }; // 문항이 속한 섹션 ID와 섹션 이름
  rating_min?: number;
  rating_max?: number;
  rating_labels?: RatingLabels;
  bun_gi?: number[]; // 분기문
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
  const [currentSectionId, setCurrentSectionId] = useState<number>(1); // 현재 보여줄 섹션 ID
  const [sections, setSections] = useState<Section[]>([]); // 모든 섹션 정보

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

        // Extract unique sections from questions
        const uniqueSections = new Map<number, string>();
        data.forEach((question: Question) => {
          if (question.section_id) {
            Object.entries(question.section_id).forEach(([id, name]) => {
              uniqueSections.set(Number(id), name as string);
            });
          }
        });

        // Convert Map to array of section objects
        const sectionsArray = Array.from(uniqueSections).map(([id, name]) => ({
          id,
          name,
        }));

        // Sort by section ID
        sectionsArray.sort((a, b) => a.id - b.id);
        setSections(sectionsArray);

        console.log(data);
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

  // Navigate to the next section
  const handleNextSection = () => {
    // Check if all required questions in current section are answered
    const currentSectionQuestions = questions.filter(
      (q) =>
        q.section_id &&
        Object.keys(q.section_id).includes(currentSectionId.toString())
    );

    const allRequiredAnswered = currentSectionQuestions.every((question) => {
      if (!question.is_required) return true;

      const response = responses[question.id];
      if (response === undefined) return false;

      // For checkbox responses, check if at least one option is selected
      if (Array.isArray(response)) {
        return response.length > 0;
      }

      // For string responses, check if not empty
      if (typeof response === "string") {
        return response.trim() !== "";
      }

      return true;
    });

    if (!allRequiredAnswered) {
      alert("모든 필수 항목을 작성해주세요.");
      return;
    }

    // Find the next section ID
    const nextSectionIndex =
      sections.findIndex((s) => s.id === currentSectionId) + 1;
    if (nextSectionIndex < sections.length) {
      setCurrentSectionId(sections[nextSectionIndex].id);
    }
  };

  // Navigate to the previous section
  const handlePreviousSection = () => {
    const prevSectionIndex =
      sections.findIndex((s) => s.id === currentSectionId) - 1;
    if (prevSectionIndex >= 0) {
      setCurrentSectionId(sections[prevSectionIndex].id);
    }
  };

  const renderQuestion = (question: Question) => {
    switch (question.question_type) {
      case "multiple_choice":
        return (
          <div className="question-options">
            {question.options?.map((option, index) => (
              <div key={option.id || option.value || index} className="option">
                <input
                  type="radio"
                  id={`${question.id}-${option.id || option.value || index}`}
                  name={question.id}
                  value={option.text || option.label}
                  checked={
                    (responses[question.id] as string) ===
                    (option.text || option.label)
                  }
                  onChange={() =>
                    handleMultipleChoiceChange(
                      question.id,
                      option.text || option.label || ""
                    )
                  }
                  required={question.is_required}
                />
                <label
                  htmlFor={`${question.id}-${
                    option.id || option.value || index
                  }`}
                >
                  {option.text || option.label}
                </label>
              </div>
            ))}
          </div>
        );

      case "checkboxes":
        return (
          <div className="question-options">
            {question.options?.map((option, index) => (
              <div key={option.id || option.value || index} className="option">
                <input
                  type="checkbox"
                  id={`${question.id}-${option.id || option.value || index}`}
                  name={question.id}
                  value={option.text || option.label}
                  checked={(
                    (responses[question.id] as string[]) || []
                  ).includes(option.text || option.label || "")}
                  onChange={() =>
                    handleCheckboxChange(
                      question.id,
                      option.text || option.label || ""
                    )
                  }
                />
                <label
                  htmlFor={`${question.id}-${
                    option.id || option.value || index
                  }`}
                >
                  {option.text || option.label}
                </label>
              </div>
            ))}
          </div>
        );

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

  // Get current section name
  const getCurrentSectionName = () => {
    const currentSection = sections.find((s) => s.id === currentSectionId);
    return currentSection ? currentSection.name : "";
  };

  // Filter questions by current section
  const getCurrentSectionQuestions = () => {
    return questions
      .filter(
        (q) =>
          q.section_id &&
          Object.keys(q.section_id).includes(currentSectionId.toString())
      )
      .sort((a, b) => a.order - b.order);
  };

  // Check if current section is the last one
  const isLastSection = () => {
    return (
      sections.length > 0 &&
      currentSectionId === sections[sections.length - 1].id
    );
  };

  // Check if current section is the first one
  const isFirstSection = () => {
    return sections.length === 0 || currentSectionId === sections[0].id;
  };

  if (loading) return <div className="loading">로딩 중...</div>;
  if (error) return <div className="error">{error}</div>;

  const currentQuestions = getCurrentSectionQuestions();

  return (
    <div className="survey-container">
      {submitted ? (
        <div className="success-message">
          <h2>설문이 성공적으로 제출되었습니다.</h2>
          <p>참여해주셔서 감사합니다.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {sections.length > 0 && (
            <div className="section-header">
              <h2>{getCurrentSectionName()}</h2>
              <div className="section-progress">
                섹션 {sections.findIndex((s) => s.id === currentSectionId) + 1}{" "}
                / {sections.length}
              </div>
            </div>
          )}

          {currentQuestions.map((question) => (
            <div key={question.id} className="question-card">
              <h3>
                {question.question_text}
                {question.is_required && <span className="required">*</span>}
              </h3>
              {renderQuestion(question)}
            </div>
          ))}

          {submitError && <div className="error">{submitError}</div>}

          <div className="navigation-buttons">
            {!isFirstSection() && (
              <button
                type="button"
                className="prev-button"
                onClick={handlePreviousSection}
              >
                이전
              </button>
            )}

            {isLastSection() ? (
              <button
                type="submit"
                className="submit-button"
                disabled={submitting}
              >
                {submitting ? "제출 중..." : "제출하기"}
              </button>
            ) : (
              <button
                type="button"
                className="next-button"
                onClick={handleNextSection}
              >
                다음
              </button>
            )}
          </div>

          {questions.length === 0 && (
            <p className="no-questions">해당 설문에 등록된 질문이 없습니다.</p>
          )}
        </form>
      )}
    </div>
  );
}
