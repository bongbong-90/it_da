// src/components/category/CategoryGrid.tsx
import { useNavigate } from 'react-router-dom';
import './CategoryGrid.css';

interface Category {
    id: string;
    icon: string;
    name: string;
    count: number;
}

// ✅ Props 추가
interface CategoryGridProps {
    limit?: number;        // 표시할 카테고리 개수 제한 (없으면 전체)
    showAllCard?: boolean; // 전체모임 카드 표시 여부 (기본: true)
}

const categories: Category[] = [
    { id: 'sports', icon: '🏃', name: '스포츠', count: 142 },
    { id: 'food', icon: '🍴', name: '맛집', count: 98 },
    { id: 'cafe', icon: '☕', name: '카페', count: 76 },
    { id: 'culture', icon: '🎨', name: '문화예술', count: 64 },
    { id: 'study', icon: '📚', name: '스터디', count: 53 },
    { id: 'hobby', icon: '🎪', name: '취미활동', count: 87 },
    { id: 'social', icon: '💬', name: '소셜', count: 91 },
];

// ✅ props 받기 (기본값 설정으로 기존 동작 유지)
const CategoryGrid = ({ limit, showAllCard = true }: CategoryGridProps = {}) => {
    const navigate = useNavigate();

    // ✅ 카테고리 필터링 로직 추가
    let displayCategories = [...categories];

    // 모임 수 기준 정렬
    displayCategories.sort((a, b) => b.count - a.count);

    // limit이 있으면 상위 N개만
    if (limit) {
        displayCategories = displayCategories.slice(0, limit);
    }

    const handleCategoryClick = (categoryName: string) => {
        navigate(`/category/${encodeURIComponent(categoryName)}`);
    };

    const handleAllMeetingsClick = () => {
        navigate('/category');
    };

    return (
        <div className="category-grid">
            {/* ✅ 필터링된 카테고리만 표시 */}
            {displayCategories.map((category) => (
                <div
                    key={category.name}
                    className="category-card"
                    onClick={() => handleCategoryClick(category.name)}
                >
                    <div className="category-icon">{category.icon}</div>
                    <div className="category-name">{category.name}</div>
                    <div className="category-count">{category.count}개 모임</div>
                </div>
            ))}

            {/* ✅ showAllCard가 true일 때만 전체모임 카드 표시 */}
            {showAllCard && (
                <div
                    key="전체 모임"
                    className="category-card category-card-all"
                    onClick={handleAllMeetingsClick}
                >
                    <div className="category-icon">🌟</div>
                    <div className="category-name">전체 모임</div>
                    <div className="category-count">모든 카테고리</div>
                </div>
            )}
        </div>
    );
};

export default CategoryGrid;