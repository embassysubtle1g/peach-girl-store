export default function CategoryNav({ categories, active, onChange }) {
  return (
    <nav className="category-nav" aria-label="商品分類">
      {categories.map((item) => (
        <button key={item.id} type="button" className={active === item.id ? 'category-chip active' : 'category-chip'} onClick={() => onChange(item.id)}>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
