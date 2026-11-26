import { ShoppingBag, Star } from 'lucide-react';

export default function ProductCard({ product, onAddToCart }) {
  return (
    <article className="product-card">
      <div className={`product-art art-${product.svgType ?? 'default'}`}>
        <span className="product-art-symbol">{product.category === 'charm' ? '🧸' : '🎀'}</span>
        {product.badge && <span className="product-badge">{product.badge}</span>}
      </div>
      <div className="product-info">
        <span className="product-category">{product.categoryName}</span>
        <h3>{product.title}</h3>
        <p className="product-subtitle">{product.subtitle}</p>
        <div className="product-meta"><span><Star size={13} fill="currentColor" /> {product.rating ?? '新商品'}</span><span>已售 {product.soldCount ?? 0}</span></div>
        <div className="product-bottom">
          <strong>NT$ {Number(product.price).toLocaleString('zh-TW')}</strong>
          <button type="button" onClick={onAddToCart} aria-label={`將 ${product.title} 加入購物車`}><ShoppingBag size={16} /></button>
        </div>
      </div>
    </article>
  );
}
