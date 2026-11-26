import { useEffect, useMemo, useState } from 'react';
import { Search, ShoppingBag, Heart, X, Plus, Minus, ArrowUpRight, SlidersHorizontal, Star, Check, Trash2, Menu } from 'lucide-react';
import { products, categories } from './data/products.js';

const money = (n) => new Intl.NumberFormat('zh-TW').format(n);
const readStore = (key, fallback) => {
  try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; } catch { return fallback; }
};

function ProductArtwork({ product, large = false }) {
  const symbols = { finished: '✳', charm: '♡', diy: '✷', hardware: '⌁' };
  return <div className={`product-artwork artwork-${product.category} ${large ? 'artwork-large' : ''}`}>
    <span className="artwork-index">PG / {String(product.id).padStart(2, '0')}</span>
    <span className="artwork-symbol">{symbols[product.category] || '✳'}</span>
    <span className="artwork-caption">{product.categoryName}</span>
  </div>;
}

function ProductModal({ product, onClose, onAdd }) {
  const [selections, setSelections] = useState({});
  const [qty, setQty] = useState(1);
  useEffect(() => { setSelections({}); setQty(1); }, [product?.id]);
  if (!product) return null;
  return <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <section className="product-modal" role="dialog" aria-modal="true" aria-label="商品詳情">
      <button className="icon-button modal-close" onClick={onClose} aria-label="關閉"><X /></button>
      <div className="modal-art"><ProductArtwork product={product} large /></div>
      <div className="modal-content">
        <p className="eyebrow">{product.categoryName} · PRODUCT DETAILS</p>
        <h2>{product.title}</h2>
        <p className="muted">{product.subtitle}</p>
        <div className="modal-price"><strong>NT$ {money(product.price)}</strong>{product.originalPrice > product.price && <del>NT$ {money(product.originalPrice)}</del>}</div>
        <p className="description">{product.description || '以細膩選材與手作細節，為日常增添一點溫柔。'}</p>
        {product.specsInfo && <div className="spec-box"><span className="eyebrow">DETAILS</span><p>{product.specsInfo}</p></div>}
        {product.variants?.map((variant) => <label className="variant-field" key={variant.name}>
          <span>{variant.name}</span>
          <select value={selections[variant.name] || ''} onChange={(e) => setSelections(s => ({ ...s, [variant.name]: e.target.value }))}>
            <option value="">請選擇{variant.name}</option>
            {variant.options.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>)}
        <div className="purchase-row">
          <div className="quantity-control"><button onClick={() => setQty(q => Math.max(1, q - 1))}><Minus size={15}/></button><span>{qty}</span><button onClick={() => setQty(q => q + 1)}><Plus size={15}/></button></div>
          <button className="primary-button" disabled={!product.inStock || (product.variants || []).some(v => !selections[v.name])} onClick={() => onAdd(product, qty, selections)}>{product.inStock ? '加入購物袋' : '暫時缺貨'} <ArrowUpRight size={16}/></button>
        </div>
        {!product.inStock && <p className="stock-note">此商品目前補貨中，歡迎稍後再來看看。</p>}
        {product.reviews?.length > 0 && <div className="reviews"><span className="eyebrow">CUSTOMER NOTES</span><h3>買家回饋</h3>{product.reviews.slice(0, 3).map((review, i) => <div className="review" key={i}><div className="review-head"><strong>{review.user}</strong><span>★ {review.rating} · {review.date}</span></div><p>{review.comment}</p></div>)}</div>}
      </div>
    </section>
  </div>;
}

function SideDrawer({ type, items, productsById, onClose, onQty, onRemove, onOpenProduct, onAdd }) {
  const isCart = type === 'cart';
  const entries = isCart ? items : items.map(id => ({ id, qty: 1 }));
  const total = entries.reduce((sum, item) => sum + (productsById[item.id]?.price || 0) * item.qty, 0);
  return <div className="overlay drawer-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <aside className="side-drawer">
      <div className="drawer-header"><div><p className="eyebrow">{isCart ? 'YOUR BAG' : 'SAVED PIECES'}</p><h2>{isCart ? '購物袋' : '我的收藏'}</h2></div><button className="icon-button" onClick={onClose}><X/></button></div>
      <div className="drawer-items">
        {entries.length === 0 ? <div className="empty-drawer"><span>✳</span><h3>{isCart ? '購物袋還是空的' : '還沒有收藏商品'}</h3><p>慢慢挑選，找到讓你心動的小物。</p></div> : entries.map(item => {
          const product = productsById[item.id]; if (!product) return null;
          return <div className="drawer-item" key={item.id}>
            <button className="drawer-thumb" onClick={() => onOpenProduct(product)}><ProductArtwork product={product}/></button>
            <div className="drawer-item-info"><button className="text-link" onClick={() => onOpenProduct(product)}>{product.title}</button><span>NT$ {money(product.price)}</span>
              {isCart && <div className="mini-qty"><button onClick={() => onQty(item.id, -1)}><Minus size={12}/></button>{item.qty}<button onClick={() => onQty(item.id, 1)}><Plus size={12}/></button></div>}
            </div>
            <button className="remove-button" onClick={() => onRemove(item.id)} aria-label="移除"><Trash2 size={15}/></button>
          </div>;
        })}
      </div>
      {isCart && <div className="drawer-footer"><div className="total-line"><span>商品小計</span><strong>NT$ {money(total)}</strong></div><p>運費與付款方式將於正式結帳功能上線後計算。</p><button className="primary-button full" disabled>結帳功能準備中</button></div>}
    </aside>
  </div>;
}

export default function App() {
  const [category, setCategory] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [activeProduct, setActiveProduct] = useState(null);
  const [drawer, setDrawer] = useState('');
  const [cart, setCart] = useState(() => readStore('peach-cart', []));
  const [favorites, setFavorites] = useState(() => readStore('peach-favorites', []));
  const [mobileSearch, setMobileSearch] = useState(false);
  const [toast, setToast] = useState('');
  const productsById = useMemo(() => Object.fromEntries(products.map(p => [p.id, p])), []);
  useEffect(() => { localStorage.setItem('peach-cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('peach-favorites', JSON.stringify(favorites)); }, [favorites]);
  const filtered = useMemo(() => products.filter(p => (category === 'all' || p.category === category) && `${p.title} ${p.subtitle || ''} ${p.categoryName || ''}`.toLowerCase().includes(keyword.trim().toLowerCase())), [category, keyword]);
  const cartCount = cart.reduce((n, item) => n + item.qty, 0);
  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 2200); };
  const addToCart = (product, qty = 1, selections = {}) => {
    setCart(current => {
      const optionText = Object.entries(selections).map(([k,v]) => `${k}：${v}`).join(' / ');
      const key = `${product.id}|${optionText}`;
      const found = current.find(item => item.key === key);
      return found ? current.map(item => item.key === key ? { ...item, qty: item.qty + qty } : item) : [...current, { id: product.id, key, qty, options: optionText }];
    });
    setActiveProduct(null); setDrawer(''); notify('已加入購物袋');
  };
  const changeQty = (id, delta) => setCart(current => current.map(item => item.id === id ? { ...item, qty: item.qty + delta } : item).filter(item => item.qty > 0));
  const removeCart = (id) => setCart(current => current.filter(item => item.id !== id));
  const toggleFavorite = (id) => setFavorites(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
  const removeFavorite = (id) => setFavorites(current => current.filter(x => x !== id));

  return <div className="site-shell">
    <div className="top-note">HANDMADE WITH CARE <span>·</span> 為日常留一點溫柔</div>
    <header className="site-header">
      <a className="brand" href="#" onClick={() => { setCategory('all'); setKeyword(''); }}><span className="brand-mark">p.</span><span><strong>PEACH GIRL</strong><small>HANDMADE STUDIO</small></span></a>
      <nav className="desktop-nav"><a href="#shop">所有商品</a><a href="#footer">聯絡我們</a></nav>
      <div className="header-actions">
        <button className="icon-button search-toggle" onClick={() => setMobileSearch(v => !v)} aria-label="搜尋"><Search/></button>
        <button className="icon-button" onClick={() => setDrawer('favorites')} aria-label="收藏"><Heart/><i>{favorites.length}</i></button>
        <button className="bag-button" onClick={() => setDrawer('cart')}><ShoppingBag size={17}/><span>購物袋</span><b>{cartCount}</b></button>
      </div>
    </header>
    {mobileSearch && <div className="mobile-search"><Search size={17}/><input autoFocus value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="搜尋商品名稱或關鍵字"/><button onClick={() => {setKeyword('');setMobileSearch(false)}}><X size={16}/></button></div>}
    <main>
      <section className="shop-section" id="shop">
        <div className="section-top"><div><p className="eyebrow">THE COLLECTION</p><h2>日常選物<span> / Shop</span></h2></div><div className="desktop-search"><Search size={17}/><input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="搜尋商品..."/>{keyword && <button onClick={() => setKeyword('')}><X size={15}/></button>}</div></div>
        <div className="shop-toolbar"><div className="category-list">{categories.map(c => <button key={c.id} className={category === c.id ? 'active' : ''} onClick={() => setCategory(c.id)}>{c.label}</button>)}</div><span className="count-label"><SlidersHorizontal size={14}/> {filtered.length} ITEMS</span></div>
        {filtered.length ? <div className="product-grid">{filtered.map((product, index) => <article className="product-card" key={product.id}>
          <div className="card-visual" onClick={() => setActiveProduct(product)} role="button" tabIndex="0" onKeyDown={e => e.key === 'Enter' && setActiveProduct(product)}><ProductArtwork product={product}/>{product.badge && <span className="card-badge">{product.badge}</span>}<button className={favorites.includes(product.id) ? 'favorite-button saved' : 'favorite-button'} onClick={e => {e.stopPropagation();toggleFavorite(product.id)}} aria-label="收藏商品"><Heart size={17} fill={favorites.includes(product.id) ? 'currentColor' : 'none'}/></button><span className="view-detail">VIEW DETAIL <ArrowUpRight size={14}/></span></div>
          <div className="card-copy"><p className="card-category">{product.categoryName}</p><button className="card-title" onClick={() => setActiveProduct(product)}>{product.title}</button><div className="card-bottom"><strong>NT$ {money(product.price)}</strong><button onClick={() => setActiveProduct(product)} aria-label="查看商品"><Plus size={17}/></button></div></div>
        </article>)}</div> : <div className="no-results"><span>✳</span><h3>沒有找到符合的商品</h3><p>試試其他關鍵字，或看看全部商品。</p><button className="text-link" onClick={() => {setKeyword('');setCategory('all')}}>清除篩選條件 →</button></div>}
      </section>
      <section className="values-section"><div><p className="eyebrow">MADE FOR YOUR EVERYDAY</p><h2>簡單的日常，<br/>也值得被好好對待。</h2></div><div className="value-items"><article><span>01</span><h3>細節手作</h3><p>從選材到完成，每個步驟都細心對待。</p></article><article><span>02</span><h3>用心選物</h3><p>挑選適合日常搭配、實用又耐看的小物。</p></article><article><span>03</span><h3>慢慢生活</h3><p>不必太多，剛剛好的喜歡就很好。</p></article></div></section>
    </main>
    <footer className="site-footer" id="footer"><div className="footer-brand"><span className="brand-mark">p.</span><div><strong>PEACH GIRL</strong><small>HANDMADE STUDIO</small></div></div><p>把喜歡的日常，慢慢串成喜歡的樣子。</p><span>© 2026 PEACH GIRL HANDMADE STUDIO</span></footer>
    {activeProduct && <ProductModal product={activeProduct} onClose={() => setActiveProduct(null)} onAdd={addToCart}/>}
    {drawer && <SideDrawer type={drawer} items={drawer === 'cart' ? cart : favorites} productsById={productsById} onClose={() => setDrawer('')} onQty={changeQty} onRemove={drawer === 'cart' ? removeCart : removeFavorite} onOpenProduct={p => {setDrawer('');setActiveProduct(p)}}/>}
    {toast && <div className="toast"><Check size={16}/>{toast}</div>}
  </div>;
}
