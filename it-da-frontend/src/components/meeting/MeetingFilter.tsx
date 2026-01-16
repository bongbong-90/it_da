// src/components/meeting/MeetingFilter.tsx
const MeetingFilter = () => {
    return (
        <div className="filter-section">
            <div className="filter-row">
                <div className="filter-label">지역</div>
                <div className="filter-chips">
                    <div className="filter-chip active">전체</div>
                    <div className="filter-chip">강남/서초</div>
                </div>
            </div>
        </div>
    );
};

export default MeetingFilter;