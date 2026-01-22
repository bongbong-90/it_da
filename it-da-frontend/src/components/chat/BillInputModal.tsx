// src/components/chat/BillInputModal.tsx
import { useState } from "react";
import "./BillInputModal.css";

interface BillInputModalProps {
    onClose: () => void;
    onSubmit: (data: any) => void;
    members: { userId: number; nickname: string }[];
}

const BillInputModal = ({ onClose, onSubmit, members }: BillInputModalProps) => {
    const [amount, setAmount] = useState<string>("");
    const [bankName, setBankName] = useState("");
    const [accountNum, setAccountNum] = useState("");
    const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);

    const toggleMember = (id: number) => {
        setSelectedMemberIds(prev =>
            prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
        );
    };

    const handleConfirm = () => {
        if (!amount || !bankName || !accountNum || selectedMemberIds.length === 0) {
            alert("모든 정보와 참여 멤버를 선택해주세요.");
            return;
        }

        const participants = members
            .filter(m => selectedMemberIds.includes(m.userId))
            .map(m => ({ userId: m.userId, name: m.nickname, isPaid: false }));

        onSubmit({
            totalAmount: Number(amount),
            participantCount: participants.length,
            account: `${bankName} ${accountNum}`,
            participants: participants // ✅ 상세 정보 포함
        });
    };

    return (
        <div className="modal-overlay">
            <div className="bill-modal">
                <div className="modal-header">
                    <h3 style={{ textAlign: 'center', width: '100%' }}>💰 정산 요청하기</h3>
                </div>

                <div className="input-group">
                    <label>총 금액</label>
                    <input type="number" step="1000" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="금액 입력" />
                </div>

                <div className="input-group">
                    <label>참여 멤버 선택 ({selectedMemberIds.length}명)</label>
                    <div className="member-selector-grid">
                        {members && members.length > 0 ? (
                            members.map(member => (
                                <div
                                    key={member.userId}
                                    className={`member-chip ${selectedMemberIds.includes(member.userId) ? 'selected' : ''}`}
                                    onClick={() => toggleMember(member.userId)}
                                >
                                    {member.nickname}
                                </div>
                            ))
                        ) : (
                            <p style={{ fontSize: '0.8rem', color: '#999' }}>멤버 정보를 불러오는 중입니다...</p>
                        )}
                    </div>
                </div>

                <div className="input-group">
                    <label>입금 계좌</label>
                    <div className="account-input-row" style={{ display: 'flex', gap: '12px', width: '100%' }}>
                        <input
                            className="bank-input"
                            placeholder="은행"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            style={{ flex: 1 }}
                        />
                        <input
                            className="account-num-input"
                            placeholder="계좌번호"
                            value={accountNum}
                            onChange={(e) => setAccountNum(e.target.value)}
                            style={{ flex: 2 }}
                        />
                    </div>
                </div>

                <div className="modal-btns"  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    marginTop: '24px'
                }}
                >
                    <button
                        className="cancel-btn"
                        onClick={onClose}
                        style={{ flex: '1 1 0%', minWidth: 0 }}
                    >
                        취소
                    </button>
                    <button
                        className="submit-btn"
                        onClick={handleConfirm}
                        style={{ flex: '2 1 0%', minWidth: 0, margin:0 }}
                    >
                        전송
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BillInputModal;