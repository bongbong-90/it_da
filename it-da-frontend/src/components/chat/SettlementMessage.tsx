// src/components/chat/SettlementMessage.tsx
import React from 'react';
import './SettlementMessage.css';

interface SettlementProps {
    message: any;
}

const SettlementMessage:React.FC<SettlementProps> = ({ message }: { message: any }) => {
    const { totalAmount, amountPerPerson, participantCount, account } = message.metadata;

    const handleCopyAccount = () => {
        navigator.clipboard.writeText(account);
        alert("계좌번호가 복사되었습니다.");
    };

    return (
        <div className="settlement-card">
            <div className="settlement-header">
                <span className="icon">💰</span>
                <h4>정산해 주세요!</h4>
            </div>
            <div className="settlement-body">
                <div className="info-row">
                    <span>총 금액</span>
                    <span className="value">{totalAmount.toLocaleString()}원</span>
                </div>
                <div className="info-row">
                    <span>정산 인원</span>
                    <span className="value">{participantCount}명</span>
                </div>
                <div className="divider" />
                <div className="info-row highlight">
                    <span>1인당 보낼 금액</span>
                    <span className="amount">{amountPerPerson.toLocaleString()}원</span>
                </div>
                <div className="account-box" onClick={handleCopyAccount}>
                    <p className="account-label">입금 계좌 (클릭 시 복사)</p>
                    <p className="account-number">{account}</p>
                </div>
            </div>
            <button className="confirm-btn">입금 완료 확인</button>
        </div>
    );
};

export default SettlementMessage;