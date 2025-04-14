import { useState } from "react";
import "./CreateForm.css";

// Define types based on the backend data models
type QuestionType =
  | "multiple_choice"
  | "rating"
  | "checkboxes"
  | "paragraph"
  | "short_answer";

interface Option {
  value: string;
  label: string;
  target_section?: string;
}

interface Section {
  id: string;
  name: string;
  order: number;
}

interface Question {
  question_text: string;
  question_type: QuestionType;
  options?: Option[];
  order: number;
  is_required: boolean;
  section_id?: { [key: number]: string };
  rating_min?: number;
  rating_max?: number;
  rating_labels?: Record<number, string>;
  bun_gi?: number[];
}

interface SurveyFormData {
  title: string;
  description?: string;
  is_active: boolean;
  questions: Question[];
  sections: Section[];
}

export default function CreateForm() {
  const [formData, setFormData] = useState<SurveyFormData>({
    title: "",
    description: "",
    is_active: true,
    questions: [],
    sections: [
      {
        id: "1",
        name: "기본",
        order: 1,
      },
    ],
  });

  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    question_text: "",
    question_type: "short_answer",
    order: 1,
    is_required: true,
    section_id: { 1: "기본" },
  });

  const [tempOption, setTempOption] = useState<Option>({
    value: "",
    label: "",
    target_section: "",
  });

  const [currentSection, setCurrentSection] = useState<Section>({
    id: "",
    name: "",
    order: 2,
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

    // Special handling for section_id
    if (name === "section_id") {
      if (!value) {
        // If no section is selected, remove section_id
        const newQuestion = { ...currentQuestion };
        delete newQuestion.section_id;
        setCurrentQuestion(newQuestion);
      } else {
        // Find the section with the selected ID
        const section = formData.sections.find((s) => s.id === value);
        if (section) {
          setCurrentQuestion({
            ...currentQuestion,
            section_id: { [parseInt(section.id)]: section.name },
          });
        }
      }
    } else {
      setCurrentQuestion({ ...currentQuestion, [name]: value });
    }
  };

  // Handle adding an option to multiple choice or checkbox questions
  const handleAddOption = () => {
    if (tempOption.value && tempOption.label) {
      setCurrentQuestion({
        ...currentQuestion,
        options: [...(currentQuestion.options || []), { ...tempOption }],
      });
      setTempOption({ value: "", label: "", target_section: "" });
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

    // Create question object
    const questionToAdd = { ...currentQuestion, order: newOrder };

    // Only include section_id if it has a value
    if (!questionToAdd.section_id) {
      delete questionToAdd.section_id;
    }

    // Only include bun_gi for multiple_choice questions
    if (questionToAdd.question_type !== "multiple_choice") {
      delete questionToAdd.bun_gi;
    }

    setFormData({
      ...formData,
      questions: [...formData.questions, questionToAdd],
    });

    // Reset current question form
    setCurrentQuestion({
      question_text: "",
      question_type: "short_answer",
      order: newOrder + 1,
      is_required: true,
      section_id: { 1: "기본" },
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

  // Add a new section
  const handleAddSection = () => {
    if (!currentSection.id || !currentSection.name) {
      alert("섹션 ID와 이름을 모두 입력해주세요.");
      return;
    }

    // Check if section ID already exists
    if (formData.sections.some((section) => section.id === currentSection.id)) {
      alert("이미 사용 중인 섹션 ID입니다.");
      return;
    }

    // Add the section with a new order number
    const newOrder = formData.sections.length + 1;
    const sectionToAdd = { ...currentSection, order: newOrder };

    setFormData({
      ...formData,
      sections: [...formData.sections, sectionToAdd],
    });

    // Reset current section form
    setCurrentSection({
      id: "",
      name: "",
      order: newOrder + 1,
    });
  };

  // Remove a section
  const handleRemoveSection = (index: number) => {
    const sectionToRemove = formData.sections[index];

    // Check if any questions use this section
    const hasQuestions = formData.questions.some(
      (q) =>
        q.section_id &&
        q.section_id[parseInt(sectionToRemove.id)] === sectionToRemove.name
    );

    if (hasQuestions) {
      alert(
        "이 섹션을 사용하는 질문이 있습니다. 먼저 해당 질문을 수정하거나 삭제해주세요."
      );
      return;
    }

    const newSections = [...formData.sections];
    newSections.splice(index, 1);

    // Update the order of remaining sections
    const updatedSections = newSections.map((s, idx) => ({
      ...s,
      order: idx + 1,
    }));

    setFormData({ ...formData, sections: updatedSections });
  };

  // Handle section input changes
  const handleSectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentSection({ ...currentSection, [name]: value });
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
      // Create a new object that matches the backend model by excluding sections
      const submissionData = {
        title: formData.title,
        description: formData.description,
        is_active: formData.is_active,
        questions: formData.questions,
      };

      console.log(submissionData);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/surveys/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submissionData),
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
        sections: [
          {
            id: "1",
            name: "기본",
            order: 1,
          },
        ],
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
                    {q.section_id && (
                      <p>
                        <strong>섹션 ID:</strong> {Object.keys(q.section_id)[0]}{" "}
                        ({Object.values(q.section_id)[0]})
                      </p>
                    )}
                    {q.bun_gi && (
                      <p>
                        <strong>분기 로직:</strong> 활성화됨
                      </p>
                    )}

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
                                {opt.target_section &&
                                  ` → 섹션: ${opt.target_section}`}
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
          <h2>섹션 관리</h2>
          {formData.sections.length > 0 ? (
            <div className="sections-list">
              {formData.sections.map((section, index) => (
                <div key={index} className="section-item">
                  <div className="section-header">
                    <span className="section-number">{section.order}</span>
                    <h3>
                      {section.name} (ID: {section.id})
                    </h3>
                    <div className="section-actions">
                      {formData.sections.length > 1 && (
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => handleRemoveSection(index)}
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-sections">아직 추가된 섹션이 없습니다.</p>
          )}

          <div className="add-section-form">
            <h3>새 섹션 추가</h3>
            <div className="form-group">
              <label htmlFor="id">섹션 ID *</label>
              <input
                type="text"
                id="id"
                name="id"
                value={currentSection.id}
                onChange={handleSectionChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="name">섹션 이름 *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={currentSection.name}
                onChange={handleSectionChange}
                required
              />
            </div>
            <button
              type="button"
              className="add-section-btn"
              onClick={handleAddSection}
            >
              섹션 추가하기
            </button>
          </div>
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
              <option value="short_answer">단답형</option>
              <option value="paragraph">긴 답변</option>
              <option value="multiple_choice">객관식 (단일 선택)</option>
              <option value="checkboxes">객관식 (다중 선택)</option>
              <option value="rating">평가</option>
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

            {/* 분기문 체크박스 (multiple_choice 유형일 때만 표시) */}
            {currentQuestion.question_type === "multiple_choice" && (
              <label className="checkbox-label" style={{ marginLeft: "20px" }}>
                <input
                  type="checkbox"
                  name="has_branching"
                  checked={!!currentQuestion.bun_gi}
                  onChange={(e) =>
                    setCurrentQuestion({
                      ...currentQuestion,
                      bun_gi: e.target.checked ? [] : undefined,
                    })
                  }
                />
                분기문
              </label>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="section_id">섹션</label>
            <select
              id="section_id"
              name="section_id"
              value={
                currentQuestion.section_id
                  ? Object.keys(currentQuestion.section_id)[0]
                  : ""
              }
              onChange={handleQuestionChange}
            >
              <option value="">섹션 없음</option>
              {formData.sections.map((section, index) => (
                <option key={index} value={section.id}>
                  {section.name} (ID: {section.id})
                </option>
              ))}
            </select>
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
                          {option.target_section &&
                            ` → 섹션: ${option.target_section}`}
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
                  {/* 분기문이 활성화된 경우에만 이동할 섹션 입력 필드 표시 */}
                  {currentQuestion.bun_gi && (
                    <input
                      type="text"
                      placeholder="이동할 섹션 ID"
                      value={tempOption.target_section || ""}
                      onChange={(e) =>
                        setTempOption({
                          ...tempOption,
                          target_section: e.target.value,
                        })
                      }
                    />
                  )}
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
