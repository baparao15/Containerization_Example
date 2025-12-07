import { useState, useEffect } from 'react';
import './CategorySidebar.css';

const CategorySidebar = ({ selectedCategory, onCategorySelect }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/listings/categories', {
                credentials: 'include'
            });
            const data = await response.json();
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="category-sidebar">
                <div className="category-header">
                    <h3>Categories</h3>
                </div>
                <div className="category-loading">Loading...</div>
            </div>
        );
    }

    return (
        <div className="category-sidebar">
            <div className="category-header">
                <h3>Browse by Category</h3>
            </div>

            <div className="category-list">
                <div
                    className={`category-item ${selectedCategory === 'all' ? 'active' : ''}`}
                    onClick={() => onCategorySelect('all')}
                >
                    <span className="category-icon">🏛️</span>
                    <span className="category-name">All Antiques</span>
                </div>

                {categories.map((category) => (
                    <div
                        key={category.id}
                        className={`category-item ${selectedCategory === category.name ? 'active' : ''}`}
                        onClick={() => onCategorySelect(category.name)}
                    >
                        <span className="category-icon">{category.icon}</span>
                        <span className="category-name">{category.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategorySidebar;
