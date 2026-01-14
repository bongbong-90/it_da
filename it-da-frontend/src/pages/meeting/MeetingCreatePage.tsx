import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import axios from "axios";
import "./MeetingCreatePage.css";

const MeetingCreatePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    meetingTime: "",
    locationName: "",
    locationAddress: "",
    latitude: 37.5665,
    longitude: 126.978,
    maxParticipants: 10,
    expectedCost: 0,
    locationType: "OUTDOOR",
    vibe: "활기찬",
    timeSlot: "EVENING",
  });

  const [loading, setLoading] = useState(false);

  const categories = [
    { value: "스포츠", label: "스포츠" },
    { value: "맛집", label: "맛집" },
    { value: "카페", label: "카페" },
    { value: "문화예술", label: "문화예술" },
    { value: "스터디", label: "스터디" },
    { value: "취미활동", label: "취미활동" },
    { value: "소셜", label: "소셜" },
  ];

  const vibes = [
    "활기찬",
    "여유로운",
    "힐링",
    "진지한",
    "즐거운",
    "감성적인",
    "건강한",
    "배움",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:8080/api/meetings",
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const meetingId = response.data.meetingId;
      navigate(`/meetings/${meetingId}/complete`);
    } catch (error) {
      console.error("모임 생성 실패:", error);
      alert("모임 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="meeting-create-page">
      <header className="page-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ←
        </button>
        <h1>모임 만들기</h1>
      </header>

      <form className="meeting-form" onSubmit={handleSubmit}>
        {/* 기본 정보 */}
        <section className="form-section">
          <h2>📝 기본 정보</h2>

          <div className="form-group">
            <label htmlFor="title">모임 제목 *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="예: 한강 선셋 러닝"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">모임 설명 *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="모임에 대해 자세히 설명해주세요"
              rows={5}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">카테고리 *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">선택하세요</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="vibe">분위기 *</label>
              <select
                id="vibe"
                name="vibe"
                value={formData.vibe}
                onChange={handleChange}
                required
              >
                {vibes.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* 일시 및 장소 */}
        <section className="form-section">
          <h2>📅 일시 및 장소</h2>

          <div className="form-group">
            <label htmlFor="meetingTime">모임 일시 *</label>
            <input
              type="datetime-local"
              id="meetingTime"
              name="meetingTime"
              value={formData.meetingTime}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="locationName">장소 이름 *</label>
            <input
              type="text"
              id="locationName"
              name="locationName"
              value={formData.locationName}
              onChange={handleChange}
              placeholder="예: 여의도 한강공원"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="locationAddress">상세 주소</label>
            <input
              type="text"
              id="locationAddress"
              name="locationAddress"
              value={formData.locationAddress}
              onChange={handleChange}
              placeholder="예: 서울 영등포구 여의동로 330"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="locationType">장소 유형 *</label>
              <select
                id="locationType"
                name="locationType"
                value={formData.locationType}
                onChange={handleChange}
              >
                <option value="INDOOR">실내</option>
                <option value="OUTDOOR">야외</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="timeSlot">시간대 *</label>
              <select
                id="timeSlot"
                name="timeSlot"
                value={formData.timeSlot}
                onChange={handleChange}
              >
                <option value="MORNING">오전</option>
                <option value="AFTERNOON">오후</option>
                <option value="EVENING">저녁</option>
                <option value="NIGHT">밤</option>
              </select>
            </div>
          </div>
        </section>

        {/* 참여 인원 및 비용 */}
        <section className="form-section">
          <h2>👥 참여 정보</h2>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="maxParticipants">최대 인원 *</label>
              <input
                type="number"
                id="maxParticipants"
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleChange}
                min="2"
                max="100"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="expectedCost">예상 비용 (원)</label>
              <input
                type="number"
                id="expectedCost"
                name="expectedCost"
                value={formData.expectedCost}
                onChange={handleChange}
                min="0"
                step="1000"
              />
            </div>
          </div>
        </section>

        {/* 제출 버튼 */}
        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={() => navigate(-1)}
          >
            취소
          </button>
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "생성 중..." : "모임 만들기"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MeetingCreatePage;
