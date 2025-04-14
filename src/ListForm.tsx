import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./App.css";

interface SurveyList {
  id: string;
  title: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
}

export default function ListForm() {
  const [surveys, setSurveys] = useState<SurveyList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/surveys/`
        );

        if (!response.ok) {
          throw new Error("설문 목록을 불러오는데 실패했습니다.");
        }

        const data = await response.json();
        setSurveys(data);
      } catch (error) {
        console.error("Error fetching surveys:", error);
        setError("설문 목록을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchSurveys();
  }, []);

  if (loading) return <div className="loading">로딩 중...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="survey-list-container">
      <h1>설문 목록</h1>

      <Link to="/create" className="create-button">
        새 설문 만들기
      </Link>

      {surveys.length === 0 ? (
        <p className="no-surveys">등록된 설문이 없습니다.</p>
      ) : (
        <div className="survey-list">
          {surveys.map((survey) => (
            <div key={survey.id} className="survey-item">
              <h2>{survey.title}</h2>
              {survey.description && <p>{survey.description}</p>}
              <div className="survey-status">
                상태: {survey.is_active ? "활성" : "비활성"}
              </div>
              {survey.created_at && (
                <div className="survey-date">
                  생성일: {new Date(survey.created_at).toLocaleDateString()}
                </div>
              )}
              <div className="survey-actions">
                <Link to={`/survey/${survey.id}`} className="survey-link">
                  설문 보기
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
