import React from "react";
import { User } from "../../types/user.types";

interface Props {
    members: User[];
    onFollow: (userId: number) => void;
    onReport: (userId: number, userName: string) => void;
}

const ChatMemberList: React.FC<Props> = ({ members, onFollow, onReport }) => {
    return (
        <div className="flex flex-col gap-3">
            {members.map((member) => (
                <div key={member.userId} className="member-item">
                    {/* 아바타 */}
                    <div className="member-avatar">
                        {(member.name || member.nickname || member.username)[0]}
                    </div>

                    {/* 닉네임 중복 방지 로직이 적용된 정보 영역 */}
                    <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-800 truncate">
                            {/* ✅ 중복 방지: member.name 혹은 nickname 중 하나만 사용 */}
                            {member.name || member.nickname || member.username}
                        </div>
                        <div className="text-xs text-gray-500">
                            {member.role === "ME" ? "나" : member.role === "LEADER" ? "👑 모임장" : "멤버"}
                        </div>
                    </div>

                    {/* 버튼 영역 */}
                    <div className="flex gap-2 flex-shrink-0">
                        {member.role !== "ME" && (
                            <>
                                <button
                                    onClick={() => onFollow(member.userId)}
                                    className="btn-mini btn-follow"
                                >
                                    팔로우
                                </button>
                                <button
                                    onClick={() => onReport(member.userId, member.name || member.nickname || member.username)}
                                    className="btn-mini btn-report"
                                >
                                    신고
                                </button>
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ChatMemberList;