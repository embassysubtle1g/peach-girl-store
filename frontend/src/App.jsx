import { useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import CategoryNav from './components/CategoryNav.jsx';
import ProductGrid from './components/ProductGrid.jsx';
import Footer from './components/Footer.jsx';
import { products, categories } from './data/products.js';

export default function App() {
  const [category, setCategory] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [cartCount, setCartCount] = useState(0);

  const visibleProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = category === 'all' || product.category === category;
      const text = `${product.title} ${product.subtitle ?? ''} ${product.categoryName ?? ''}`.toLowerCase();
      return matchesCategory && text.includes(keyword.trim().toLowerCase());
    });
  }, [category, keyword]);

  return (
    <div className="store-shell">
      <div className="announcement">✦ 蜜桃女孩手作工作室｜把日常的小美好串在一起 ✦</div>
      <Header cartCount={cartCount} keyword={keyword} onSearch={setKeyword} />
      <main>
        <Hero />
        <CategoryNav categories={categories} active={category} onChange={setCategory} />
        <ProductGrid products={visibleProducts} onAddToCart={() => setCartCount((count) => count + 1)} />
      </main>
      <Footer />
    </div>
  );
}
