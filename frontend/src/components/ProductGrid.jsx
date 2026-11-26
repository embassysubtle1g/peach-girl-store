import ProductCard from './ProductCard.jsx';

export default function ProductGrid({ products, onAddToCart }) {
  return (
    <section className="products-section" id="products">
      <div className="section-heading">
        <div><span className="eyebrow">OUR HANDMADE PICKS</span><h2>尋找你的心動小物</h2></div>
        <span className="result-count">共 {products.length} 件商品</span>
      </div>
      {products.length ? (
        <div className="product-grid">
          {products.map((product) => <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />)}
        </div>
      ) : <p className="empty-state">找不到符合條件的商品，試試其他關鍵字吧。</p>}
    </section>
  );
}
