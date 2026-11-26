import { useEffect, useMemo, useState } from 'react';
import {
  Search, ShoppingBag, X, Plus, Minus, ArrowUpRight, Heart, Sun, Moon,
  SlidersHorizontal, Package, ShieldCheck, Sparkles, Check, Trash2
} from 'lucide-react';
import { products, categories } from './data/products.js';

const money = (n) => new Intl.NumberFormat('zh-TW').format(n);
const SHIPPING_THRESHOLD = 3000;

function ProductArtwork({ product, compact = false }) {
  const symbols = {
    'pearl-bow': '✳', 'tulip-strap': '✿', 'camellia-wrist': '❀', 'moonstone-chain': '✧',
    'amber-bear': '♡', 'charm-bear': '♧', 'charm-capybara': '☁', 'charm-bunny': '◌',
    'charm-unicorn': '✦', 'diy-kit': '✂', 'diy-jar': '✿', 'diy-bag': '♡',
    'hw-clasp': '⌁', 'hw-wire': '〰'
  };
  return <div className={'artwork artwork-' + product.category + (compact ? ' artwork-compact' : '')}>
    <span className="artwork-orbit" />
    <span className="artwork-symbol">{symbols[product.svgType] || '✳'}</span>
    <span className="artwork-caption">PEACH GIRL · HANDMADE</span>
    <span className="artwork-number">{String(product.id).padStart(2, '0')}</span>
  </div>;
}

function ProductCard({ product, onOpen, onAdd, wished, onWish }) {
  return <article className="product-card">
    <div className="product-visual" role="button" tabIndex={0} onClick={() => onOpen(product)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onOpen(product); }} aria-label={'查看 ' + product.title}>
      <ProductArtwork product={product} />
      {product.badge && <span className="product-flag">{product.badge}</span>}
      <button className={'wish-button' + (wished ? ' wished' : '')} onClick={(e) => { e.stopPropagation(); onWish(product.id); }} aria-label={wished ? '取消收藏' : '加入收藏'}>
        <Heart size={17} fill={wished ? 'currentColor' : 'none'} />
      </button>
      <span className="quick-view">查看商品 <ArrowUpRight size={15} /></span>
    </div>
    <div className="product-info">
      <div className="product-category">{product.categoryName}</div>
      <button className="product-title" onClick={() => onOpen(product)}>{product.title}</button>
      <div className="product-subtitle">{product.subtitle}</div>
      <div className="product-bottom">
        <div className="product-price">NT$ {money(product.price)}</div>
        <button className="add-button" onClick={() => onAdd(product)} aria-label="加入購物袋"><Plus size={17} /></button>
      </div>
    </div>
  </article>;
}

function ProductDialog({ product, onClose, onAdd }) {
  const [variant, setVariant] = useState({});
  useEffect(() => setVariant({}), [product]);
  if (!product) return null;
  return <div className="overlay modal-overlay" onMouseDown={onClose}>
    <section className="product-dialog" onMouseDown={e => e.stopPropagation()}>
      <div className="dialog-head"><span>{product.categoryName} · 商品詳情</span><button className="icon-button" onClick={onClose} aria-label="關閉"><X /></button></div>
      <div className="dialog-body">
        <div className="dialog-art"><ProductArtwork product={product} /></div>
        <div className="dialog-copy">
          <div className="eyebrow">PEACH GIRL · HANDMADE</div>
          <h2>{product.title}</h2>
          <p className="dialog-subtitle">{product.subtitle}</p>
          <div className="dialog-price">NT$ {money(product.price)} {product.originalPrice > product.price && <del>NT$ {money(product.originalPrice)}</del>}</div>
          <p className="dialog-description">{product.description}</p>
          {product.specsInfo && <div className="spec-note">{product.specsInfo}</div>}
          {product.rating && <div className="review-summary"><span>★★★★★</span><strong>{product.rating.toFixed(1)}</strong><small>{product.reviewCount || 0} 則評價 · 已售 {product.soldCount || 0}</small></div>}
          {product.reviews?.length > 0 && <div className="review-list"><strong>買家分享</strong>{product.reviews.slice(0, 2).map((review, i) => <div className="review-item" key={i}><div><b>{review.user}</b><small>{review.date}</small><span>{'★'.repeat(review.rating)}</span></div><p>{review.comment}</p></div>)}</div>}
          {product.variants?.map((group, i) => <fieldset className="variant-group" key={group.name}>
            <legend>{group.name}</legend>
            <div className="variant-options">{group.options.map(option => <button type="button" key={option} className={variant[i] === option ? 'variant active' : 'variant'} onClick={() => setVariant(v => ({ ...v, [i]: option }))}>{option}</button>)}</div>
          </fieldset>)}
          <button className="primary-button dialog-add" disabled={!product.inStock} onClick={() => { onAdd(product, variant); onClose(); }}>
            {product.inStock ? '加入購物袋' : '目前缺貨'} <ArrowUpRight size={17} />
          </button>
          <p className="stock-note">{product.inStock ? '現貨供應' : '目前缺貨'} · {product.freeShippingEligible ? '符合免運活動' : '運費依購物袋計算'}</p>
        </div>
      </div>
    </section>
  </div>;
}

function CartDrawer({ open, items, onClose, onChange, onRemove }) {
  if (!open) return null;
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const progress = Math.min(100, Math.round(subtotal / SHIPPING_THRESHOLD * 100));
  const remaining = Math.max(0, SHIPPING_THRESHOLD - subtotal);
  return <div className="cart-layer" onMouseDown={onClose}>
    <aside className="cart-drawer" onMouseDown={e => e.stopPropagation()}>
      <div className="drawer-head">
        <div><div className="eyebrow">YOUR BAG</div><h2>購物袋 <span>({count})</span></h2><p>把喜歡的小物帶回家。</p></div>
        <button className="icon-button" onClick={onClose} aria-label="關閉購物袋"><X /></button>
      </div>
      <div className="shipping-progress">
        <div className="shipping-copy">{remaining === 0 ? '已達免運門檻，享免費配送' : '再選購 NT$ ' + money(remaining) + ' 即可享免運'}<strong>{progress}%</strong></div>
        <div className="progress-track"><span style={{ width: progress + '%' }} /></div>
      </div>
      {items.length === 0 ? <div className="empty-cart"><ShoppingBag size={38} /><p>購物袋目前是空的</p><button className="text-link" onClick={onClose}>繼續逛逛 <ArrowUpRight size={15} /></button></div> :
        <><div className="cart-items">{items.map(item => <div className="cart-item" key={item.key}>
          <div className="cart-thumb"><ProductArtwork product={item} compact /></div>
          <div className="cart-item-copy"><strong>{item.title}</strong>{item.variantText && <small>{item.variantText}</small>}<span>NT$ {money(item.price)}</span>
            <div className="quantity"><button onClick={() => onChange(item.key, -1)} aria-label="減少數量"><Minus size={13} /></button><span>{item.quantity}</span><button onClick={() => onChange(item.key, 1)} aria-label="增加數量"><Plus size={13} /></button></div>
          </div>
          <button className="remove-item" onClick={() => onRemove(item.key)} aria-label="移除商品"><Trash2 size={15} /></button>
        </div>)}</div>
        <div className="cart-total"><div><span>商品小計</span><strong>NT$ {money(subtotal)}</strong></div><div><span>運費</span><strong>{subtotal === 0 || remaining === 0 ? '免費' : '結帳時確認'}</strong></div><p className="checkout-note">目前提供購物袋試用，線上結帳功能尚未開放。</p><button className="primary-button" onClick={onClose}>繼續選購 <ArrowUpRight size={17} /></button></div></>}
    </aside>
  </div>;
}

export default function App() {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const [onlyWishlist, setOnlyWishlist] = useState(false);
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('peach-girl-wishlist') || '[]'); } catch { return []; }
  });
  const [dark, setDark] = useState(() => localStorage.getItem('peach-girl-theme') === 'dark');
  const [toast, setToast] = useState('');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('peach-girl-theme', dark ? 'dark' : 'light');
  }, [dark]);
  useEffect(() => localStorage.setItem('peach-girl-wishlist', JSON.stringify(wishlist)), [wishlist]);

  const filtered = useMemo(() => {
    let list = products.filter(p =>
      (category === 'all' || p.category === category) &&
      (!onlyWishlist || wishlist.includes(p.id)) &&
      (p.title + p.subtitle + p.categoryName + p.description).toLowerCase().includes(search.trim().toLowerCase())
    );
    if (sortBy === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [category, search, onlyWishlist, wishlist, sortBy]);

  const notify = (message) => {
    setToast(message);
    window.clearTimeout(window.__peachToastTimer);
    window.__peachToastTimer = window.setTimeout(() => setToast(''), 2200);
  };
  const addToCart = (product, variants = {}) => {
    if (!product.inStock) { notify('這項商品目前缺貨'); return; }
    const variantText = Object.entries(variants).map(([i, value]) => product.variants?.[Number(i)]?.name + '：' + value).join(' / ');
    const key = product.id + '-' + variantText;
    setCart(items => {
      const found = items.find(x => x.key === key);
      return found ? items.map(x => x.key === key ? { ...x, quantity: x.quantity + 1 } : x) : [...items, { ...product, key, variantText, quantity: 1 }];
    });
    setCartOpen(true);
    notify('已加入購物袋');
  };
  const changeCart = (key, delta) => setCart(items => items.map(x => x.key === key ? { ...x, quantity: x.quantity + delta } : x).filter(x => x.quantity > 0));
  const removeCart = (key) => setCart(items => items.filter(x => x.key !== key));
  const toggleWish = (id) => setWishlist(items => items.includes(id) ? items.filter(x => x !== id) : [...items, id]);
  const resetFilters = () => { setCategory('all'); setSearch(''); setSortBy('featured'); setOnlyWishlist(false); };

  const hero = products[0];
  const count = cart.reduce((s, x) => s + x.quantity, 0);
  const categoryTitle = onlyWishlist ? '我的收藏' : categories.find(c => c.id === category)?.label || '全部商品';

  return <div className="app-shell">
    <div className="ambient ambient-one" /><div className="ambient ambient-two" /><div className="ambient ambient-three" />
    <div className="announcement"><Sparkles size={13} /> 把喜歡的日常，慢慢串成喜歡的樣子。</div>
    <header className="site-header">
      <a className="wordmark" href="#top" onClick={resetFilters}><span className="brand-mark">p.</span><span>PEACH GIRL<small>HANDMADE SELECT SHOP</small></span></a>
      <nav className="main-nav">{categories.map(c => <button key={c.id} className={category === c.id && !onlyWishlist ? 'nav-active' : ''} onClick={() => { setCategory(c.id); setOnlyWishlist(false); }}>{c.label}</button>)}</nav>
      <div className="header-actions">
        <div className="header-search"><Search size={16} /><input placeholder="搜尋手作選物..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <button className="mobile-search-toggle icon-button" onClick={() => setShowSearch(v => !v)} aria-label="開啟搜尋"><Search size={19} /></button>
        <button className="icon-button theme-button" onClick={() => setDark(v => !v)} aria-label="切換深淺色">{dark ? <Sun size={19} /> : <Moon size={19} />}</button>
        <button className="bag-button" onClick={() => setCartOpen(true)}><ShoppingBag size={18} /><span>購物袋</span><b>{count}</b></button>
      </div>
      <div className="mobile-category-nav">{categories.map(c => <button key={c.id} className={category === c.id && !onlyWishlist ? 'active' : ''} onClick={() => { setCategory(c.id); setOnlyWishlist(false); }}>{c.label}</button>)}</div>
    </header>
    {showSearch && <div className="mobile-search-strip"><Search size={17} /><input autoFocus placeholder="搜尋喜歡的手作商品..." value={search} onChange={e => setSearch(e.target.value)} /><button onClick={() => { setSearch(''); setShowSearch(false); }} aria-label="清除搜尋"><X size={17} /></button></div>}

    <main className="page-content" id="top">
      <section className="hero glass-card">
        <div className="hero-glow" />
        <div className="hero-copy">
          <div className="hero-tag"><span /> PEACH GIRL · HANDMADE COLLECTION</div>
          <h1>把喜歡的日常，<br /><em>慢慢串成喜歡的樣子。</em></h1>
          <p>從一顆珠子、一條手機鍊，到親手完成的小作品。<br />讓每一份細節，都成為生活裡剛剛好的溫柔。</p>
          <div className="hero-pills"><span>手作手機鍊</span><span>可愛萌粒</span><span>DIY 串珠材料</span></div>
          <div className="hero-actions"><a className="primary-button" href="#catalog">探索手作選物 <ArrowUpRight size={17} /></a><button className="secondary-button" onClick={() => setCategory('finished')}>看看人氣手機鍊</button></div>
        </div>
        <button className="hero-art" onClick={() => setSelected(hero)} aria-label={'查看 ' + hero.title}>
          <ProductArtwork product={hero} />
          <span className="hero-product-chip"><span><strong>{hero.title}</strong><small>人氣手作 · NT$ {money(hero.price)}</small></span><ArrowUpRight size={19} /></span>
        </button>
      </section>

      <section className="catalog-section" id="catalog">
        <div className="catalog-heading">
          <div><div className="eyebrow">FIND YOUR LITTLE FAVORITE</div><h2>{categoryTitle}</h2><p>每一件小物，都有自己的可愛細節。</p></div>
          <div className="catalog-tools"><button className={'wishlist-filter' + (onlyWishlist ? ' active' : '')} onClick={() => setOnlyWishlist(v => !v)}><Heart size={16} fill={onlyWishlist ? 'currentColor' : 'none'} /> 我的收藏</button><label className="sort-select"><SlidersHorizontal size={15} /><select value={sortBy} onChange={e => setSortBy(e.target.value)}><option value="featured">精選推薦</option><option value="price-asc">價格：低至高</option><option value="price-desc">價格：高至低</option></select></label></div>
        </div>
        <div className="catalog-subbar"><div className="category-pills">{categories.map(c => <button key={c.id} className={category === c.id && !onlyWishlist ? 'active' : ''} onClick={() => { setCategory(c.id); setOnlyWishlist(false); }}>{c.label}</button>)}</div><span className="item-count">{filtered.length} ITEMS</span></div>
        {filtered.length ? <div className="product-grid">{filtered.map(p => <ProductCard key={p.id} product={p} onOpen={setSelected} onAdd={addToCart} wished={wishlist.includes(p.id)} onWish={toggleWish} />)}</div> :
          <div className="empty-state"><Search size={27} /><h3>找不到相符的商品</h3><p>試試其他關鍵字，或重設篩選條件。</p><button className="secondary-button" onClick={resetFilters}>顯示全部商品</button></div>}
      </section>

      <section className="service-row">
        <div className="service-card glass-card"><span className="service-icon"><Package /></span><div><strong>用心包裝每份心意</strong><p>讓每件手作，都有值得期待的開箱時刻。</p></div></div>
        <div className="service-card glass-card"><span className="service-icon"><ShieldCheck /></span><div><strong>細節與品質把關</strong><p>仔細挑選材料，慢慢完成每一份作品。</p></div></div>
        <div className="service-card glass-card"><span className="service-icon"><Heart /></span><div><strong>把日常變得可愛</strong><p>挑一份喜歡的小物，收藏生活裡的溫柔。</p></div></div>
      </section>
    </main>
    <footer className="site-footer"><a className="wordmark" href="#top"><span className="brand-mark">p.</span><span>PEACH GIRL<small>HANDMADE SELECT SHOP</small></span></a><span>© 2026 PEACH GIRL · MADE WITH LOVE.</span><a href="#top">BACK TO TOP ↑</a></footer>
    <ProductDialog product={selected} onClose={() => setSelected(null)} onAdd={addToCart} />
    <CartDrawer open={cartOpen} items={cart} onClose={() => setCartOpen(false)} onChange={changeCart} onRemove={removeCart} />
    {toast && <div className="toast"><span><Check size={14} /></span>{toast}</div>}
  </div>;
}
