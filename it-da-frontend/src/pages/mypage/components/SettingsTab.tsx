import React from 'react';
import './SettingsTab.css';

interface Props {
    onProfileEdit: () => void;
    onLogout: () => void;
    notifyFollowMeeting?: boolean;
    notifyFollowReview?: boolean;
    onToggleFollowMeeting: () => void;
    onToggleFollowReview: () => void;
    isPublic?: boolean;
    onTogglePublic: () => void;
    onDeleteAccount: () => void;
    onPreferenceEdit: () => void;  // ✅ 추가: 선호도 수정 핸들러
}

const SettingsTab: React.FC<Props> = ({
                                          onProfileEdit,
                                          onLogout,
                                          notifyFollowMeeting,
                                          notifyFollowReview,
                                          onToggleFollowMeeting,
                                          onToggleFollowReview,
                                          isPublic,
                                          onTogglePublic,
                                          onDeleteAccount,
                                          onPreferenceEdit  // ✅ 추가
                                      }) => {
    return (
        <div className="settings-tab">
            <div className="settings-list">
                {/* 프로필 수정 */}
                <div className="setting-item" onClick={onProfileEdit}>
                    <div className="setting-left">
                        <div className="setting-icon">👤</div>
                        <div className="setting-info">
                            <div className="setting-title">프로필 수정</div>
                            <div className="setting-desc">이름, 프로필 사진 변경</div>
                        </div>
                    </div>
                    <span className="setting-arrow">→</span>
                </div>

                {/* ✅ 나의 선호도 보기 (새로 추가) */}
                <div className="setting-item highlight" onClick={onPreferenceEdit}>
                    <div className="setting-left">
                        <div className="setting-icon">🎯</div>
                        <div className="setting-info">
                            <div className="setting-title">나의 선호도 보기</div>
                            <div className="setting-desc">AI 맞춤 추천을 위한 성향 수정</div>
                        </div>
                    </div>
                    <span className="setting-arrow">→</span>
                </div>

                {/* 프로필 공개 */}
                <div className="setting-item" onClick={(e) => e.stopPropagation()}>
                    <div className="setting-left">
                        <div className="setting-icon">🌐</div>
                        <div className="setting-info">
                            <div className="setting-title">프로필 공개</div>
                            <div className="setting-desc">다른 사용자가 내 프로필을 볼 수 있음</div>
                        </div>
                    </div>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={isPublic ?? true}
                            onChange={onTogglePublic}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>

                {/* 팔로우 모임 참가 알림 */}
                <div className="setting-item" onClick={(e) => e.stopPropagation()}>
                    <div className="setting-left">
                        <div className="setting-icon">👥</div>
                        <div className="setting-info">
                            <div className="setting-title">팔로우 모임 참가 알림</div>
                            <div className="setting-desc">팔로우한 사람이 모임에 참가하면 알림</div>
                        </div>
                    </div>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={notifyFollowMeeting ?? true}
                            onChange={onToggleFollowMeeting}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>

                {/* 팔로우 후기 작성 알림 */}
                <div className="setting-item" onClick={(e) => e.stopPropagation()}>
                    <div className="setting-left">
                        <div className="setting-icon">⭐</div>
                        <div className="setting-info">
                            <div className="setting-title">팔로우 후기 작성 알림</div>
                            <div className="setting-desc">팔로우한 사람이 후기를 작성하면 알림</div>
                        </div>
                    </div>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={notifyFollowReview ?? true}
                            onChange={onToggleFollowReview}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>

                {/* 로그아웃 */}
                <div className="setting-item" onClick={onLogout}>
                    <div className="setting-left">
                        <div className="setting-icon">🚪</div>
                        <div className="setting-info">
                            <div className="setting-title">로그아웃</div>
                        </div>
                    </div>
                    <span className="setting-arrow">→</span>
                </div>

                {/* 계정 삭제 */}
                <div className="setting-item danger" onClick={onDeleteAccount}>
                    <div className="setting-left">
                        <div className="setting-icon">🗑️</div>
                        <div className="setting-info">
                            <div className="setting-title" style={{ color: '#dc3545' }}>계정 삭제</div>
                            <div className="setting-desc">모든 데이터가 삭제됩니다</div>
                        </div>
                    </div>
                    <span className="setting-arrow">→</span>
                </div>
            </div>
        </div>
    );
};

export default SettingsTab;
