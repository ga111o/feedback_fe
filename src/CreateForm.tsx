import { useState } from "react";
import "./CreateForm.css";

// Define types based on the backend data models
type QuestionType =
  | "multiple_choice"
  | "text"
  | "rating"
  | "checkboxes"
  | "paragraph"
  | "short_answer";

interface Option {
  value: string;
  label: string;
}

interface Question {
  question_text: string;
  question_type: QuestionType;
  options?: Option[];
  order: number;
  is_required: boolean;
  rating_min?: number;
  rating_max?: number;
  rating_labels?: Record<number, string>;
}

interface SurveyFormData {
  title: string;
  description?: string;
  is_active: boolean;
  questions: Question[];
}

export default function CreateForm() {
  const [formData, setFormData] = useState<SurveyFormData>({
    title: "",
    description: "",
    is_active: true,
    questions: [],
  });

  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    question_text: "",
    question_type: "text",
    order: 1,
    is_required: true,
  });

  const [tempOption, setTempOption] = useState<Option>({
    value: "",
    label: "",
  });

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  };

  // Handle question input changes
  const handleQuestionChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setCurrentQuestion({ ...currentQuestion, [name]: value });
  };

  // Handle adding an option to multiple choice or checkbox questions
  const handleAddOption = () => {
    if (tempOption.value && tempOption.label) {
      setCurrentQuestion({
        ...currentQuestion,
        options: [...(currentQuestion.options || []), { ...tempOption }],
      });
      setTempOption({ value: "", label: "" });
    }
  };

  // Handle removing an option
  const handleRemoveOption = (index: number) => {
    if (currentQuestion.options) {
      const newOptions = [...currentQuestion.options];
      newOptions.splice(index, 1);
      setCurrentQuestion({ ...currentQuestion, options: newOptions });
    }
  };

  // Add current question to the questions array
  const handleAddQuestion = () => {
    // Validate question
    if (!currentQuestion.question_text) {
      alert("질문 내용을 입력해주세요.");
      return;
    }

    // Validate options for multiple choice and checkboxes
    if (
      ["multiple_choice", "checkboxes"].includes(
        currentQuestion.question_type
      ) &&
      (!currentQuestion.options || currentQuestion.options.length < 2)
    ) {
      alert("선택 항목을 최소 2개 이상 추가해주세요.");
      return;
    }

    // Add the question with a new order number
    const newOrder = formData.questions.length + 1;
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        { ...currentQuestion, order: newOrder },
      ],
    });

    // Reset current question form
    setCurrentQuestion({
      question_text: "",
      question_type: "text",
      order: newOrder + 1,
      is_required: true,
    });
  };

  // Remove a question from the list
  const handleRemoveQuestion = (index: number) => {
    const newQuestions = [...formData.questions];
    newQuestions.splice(index, 1);

    // Update the order of remaining questions
    const updatedQuestions = newQuestions.map((q, idx) => ({
      ...q,
      order: idx + 1,
    }));

    setFormData({ ...formData, questions: updatedQuestions });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate the form
    if (!formData.title) {
      alert("설문 제목을 입력해주세요.");
      return;
    }

    if (formData.questions.length === 0) {
      alert("최소 1개 이상의 질문을 추가해주세요.");
      return;
    }

    try {
      console.log(formData);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/surveys/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error("서버 오류가 발생했습니다.");
      }

      const data = await response.json();
      alert("설문이 성공적으로 생성되었습니다!");
      console.log("Created survey:", data);

      // Reset the form
      setFormData({
        title: "",
        description: "",
        is_active: true,
        questions: [],
      });
    } catch (error) {
      console.error("Error creating survey:", error);
      alert("설문 생성에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div className="create-form-container">
      <h1>새 설문조사 만들기</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h2>기본 정보</h2>
          <div className="form-group">
            <label htmlFor="title">설문 제목 *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">설문 설명</label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ""}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleCheckboxChange}
              />
              활성화
            </label>
          </div>
        </div>

        <div className="form-section">
          <h2>질문 목록</h2>
          {formData.questions.length > 0 ? (
            <div className="questions-list">
              {formData.questions.map((q, index) => (
                <div key={index} className="question-item">
                  <div className="question-header">
                    <span className="question-number">{q.order}</span>
                    <h3>{q.question_text}</h3>
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => handleRemoveQuestion(index)}
                    >
                      삭제
                    </button>
                  </div>
                  <div className="question-details">
                    <p>
                      <strong>유형:</strong> {q.question_type}
                    </p>
                    <p>
                      <strong>필수 여부:</strong>{" "}
                      {q.is_required ? "예" : "아니오"}
                    </p>

                    {["multiple_choice", "checkboxes"].includes(
                      q.question_type
                    ) &&
                      q.options && (
                        <div className="options-list">
                          <p>
                            <strong>선택 항목:</strong>
                          </p>
                          <ul>
                            {q.options.map((opt, idx) => (
                              <li key={idx}>
                                {opt.label} ({opt.value})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    {q.question_type === "rating" && (
                      <p>
                        <strong>평가 범위:</strong> {q.rating_min} ~{" "}
                        {q.rating_max}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-questions">아직 추가된 질문이 없습니다.</p>
          )}
        </div>

        <div className="form-section">
          <h2>새 질문 추가</h2>
          <div className="form-group">
            <label htmlFor="question_text">질문 내용 *</label>
            <input
              type="text"
              id="question_text"
              name="question_text"
              value={currentQuestion.question_text}
              onChange={handleQuestionChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="question_type">질문 유형 *</label>
            <select
              id="question_type"
              name="question_type"
              value={currentQuestion.question_type}
              onChange={handleQuestionChange}
            >
              <option value="text">짧은 답변</option>
              <option value="paragraph">긴 답변</option>
              <option value="multiple_choice">객관식 (단일 선택)</option>
              <option value="checkboxes">객관식 (다중 선택)</option>
              <option value="rating">평가</option>
              <option value="short_answer">단답형</option>
            </select>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_required"
                checked={currentQuestion.is_required}
                onChange={(e) =>
                  setCurrentQuestion({
                    ...currentQuestion,
                    is_required: e.target.checked,
                  })
                }
              />
              필수 질문
            </label>
          </div>

          {/* 선택형 질문일 경우 옵션 추가 UI */}
          {["multiple_choice", "checkboxes"].includes(
            currentQuestion.question_type
          ) && (
            <div className="options-container">
              <h3>선택 항목</h3>

              {/* 기존 옵션 목록 */}
              {currentQuestion.options &&
                currentQuestion.options.length > 0 && (
                  <div className="options-list">
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="option-item">
                        <span>
                          {option.label} ({option.value})
                        </span>
                        <button
                          type="button"
                          className="remove-option-btn"
                          onClick={() => handleRemoveOption(index)}
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                )}

              {/* 새 옵션 추가 UI */}
              <div className="add-option-form">
                <div className="option-inputs">
                  <input
                    type="text"
                    placeholder="옵션 값 (value)"
                    value={tempOption.value}
                    onChange={(e) =>
                      setTempOption({ ...tempOption, value: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="옵션 라벨 (label)"
                    value={tempOption.label}
                    onChange={(e) =>
                      setTempOption({ ...tempOption, label: e.target.value })
                    }
                  />
                </div>
                <button
                  type="button"
                  className="add-option-btn"
                  onClick={handleAddOption}
                >
                  옵션 추가
                </button>
              </div>
            </div>
          )}

          {/* 평가형 질문일 경우 최소/최대값 설정 UI */}
          {currentQuestion.question_type === "rating" && (
            <div className="rating-settings">
              <h3>평가 설정</h3>
              <div className="rating-inputs">
                <div className="form-group">
                  <label htmlFor="rating_min">최소값</label>
                  <input
                    type="number"
                    id="rating_min"
                    name="rating_min"
                    value={currentQuestion.rating_min || 1}
                    onChange={handleQuestionChange}
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="rating_max">최대값</label>
                  <input
                    type="number"
                    id="rating_max"
                    name="rating_max"
                    value={currentQuestion.rating_max || 5}
                    onChange={handleQuestionChange}
                    min="2"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            className="add-question-btn"
            onClick={handleAddQuestion}
          >
            질문 추가하기
          </button>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn">
            설문 생성하기
          </button>
        </div>
      </form>
    </div>
  );
}
