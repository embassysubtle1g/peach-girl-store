import { useMemo, useState } from 'react';
import { Search, ShoppingBag, X, Plus, Minus, ArrowUpRight, Heart, SlidersHorizontal } from 'lucide-react';
import { products, categories } from './data/products.js';

const money = (n) => new Intl.NumberFormat('zh-TW').format(n);

function ProductArtwork({ product }) {
  const symbols = {
    'pearl-bow': '✳', 'tulip-strap': '✿', 'camellia-wrist': '❀', 'moonstone-chain': '✧',
    'amber-bear': '♡', 'charm-bear': '♧', 'charm-capybara': '☁', 'charm-bunny': '◌',
    'charm-unicorn': '✦', 'diy-kit': '✂', 'diy-jar': '✿', 'diy-bag': '♡',
    'hw-clasp': '⌁', 'hw-wire': '〰'
  };
  return <div className={'artwork artwork-' + product.category}>
    <span className="artwork-orbit" />
    <span className="artwork-symbol">{symbols[product.svgType] || '✳'}</span>
    <span className="artwork-caption">PEACH GIRL · HANDMADE</span>
    <span className="artwork-number">{String(product.id).padStart(2, '0')}</span>
  </div>;
}

function ProductCard({ product, onOpen, onAdd }) {
  return <article className="product-card">
    <button className="product-visual" onClick={() => onOpen(product)} aria-label={'查看' + product.title}>
      <ProductArtwork product={product} />
      {product.isNew && <span className="product-flag">NEW</span>}
      <span className="quick-view">查看商品 <ArrowUpRight size={15} /></span>
    </button>
    <div className="product-info">
      <div className="product-category">{product.categoryName}</div>
      <button className="product-title" onClick={() => onOpen(product)}>{product.title}</button>
      <div className="product-bottom">
        <div className="product-price">NT$ {money(product.price)}</div>
        <button className="add-button" onClick={() => onAdd(product)} aria-label="加入購物袋"><Plus size={17} /></button>
      </div>
    </div>
  </article>;
}

function ProductDialog({ product, onClose, onAdd }) {
  const [variant, setVariant] = useState({});
  if (!product) return null;
  return <div className="overlay" onMouseDown={onClose}>
    <section className="product-dialog" onMouseDown={e => e.stopPropagation()}>
      <button className="icon-button dialog-close" onClick={onClose}><X /></button>
      <div className="dialog-art"><ProductArtwork product={product} /></div>
      <div className="dialog-copy">
        <div className="eyebrow">{product.categoryName}</div>
        <h2>{product.title}</h2>
        <p className="dialog-subtitle">{product.subtitle}</p>
        <div className="dialog-price">NT$ {money(product.price)} <del>{product.originalPrice ? 'NT$ ' + money(product.originalPrice) : ''}</del></div>
        <p className="dialog-description">{product.description}</p>
        {product.variants?.map((group, i) => <fieldset className="variant-group" key={group.name}>
          <legend>{group.name}</legend>
          <div className="variant-options">{group.options.map(option => <button key={option} className={variant[i] === option ? 'variant active' : 'variant'} onClick={() => setVariant(v => ({ ...v, [i]: option }))}>{option}</button>)}</div>
        </fieldset>)}
        <button className="primary-button dialog-add" onClick={() => { onAdd(product, variant); onClose(); }}>加入購物袋 <ArrowUpRight size={17} /></button>
        <p className="stock-note">{product.inStock ? '現貨供應' : '目前缺貨'} · {product.freeShippingEligible ? '符合免運活動' : '依結帳計算運費'}</p>
      </div>
    </section>
  </div>;
}

function CartDrawer({ open, items, onClose, onChange }) {
  if (!open) return null;
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return <div className="overlay cart-overlay" onMouseDown={onClose}>
    <aside className="cart-drawer" onMouseDown={e => e.stopPropagation()}>
      <div className="drawer-head"><div><div className="eyebrow">YOUR BAG</div><h2>購物袋 <span>({items.reduce((s, x) => s + x.quantity, 0)})</span></h2></div><button className="icon-button" onClick={onClose}><X /></button></div>
      {items.length === 0 ? <div className="empty-cart"><ShoppingBag size={34} /><p>購物袋目前是空的</p><button className="text-link" onClick={onClose}>繼續逛逛 <ArrowUpRight size={15} /></button></div> :
        <><div className="cart-items">{items.map(item => <div className="cart-item" key={item.id}>
          <div className="cart-thumb"><ProductArtwork product={item} /></div>
          <div className="cart-item-copy"><strong>{item.title}</strong><span>NT$ {money(item.price)}</span><div className="quantity"><button onClick={() => onChange(item.id, -1)}><Minus size={13} /></button><span>{item.quantity}</span><button onClick={() => onChange(item.id, 1)}><Plus size={13} /></button></div></div>
          <button className="remove-item" onClick={() => onChange(item.id, -item.quantity)}><X size={15} /></button>
        </div>)}</div><div className="cart-total"><div><span>商品小計</span><strong>NT$ {money(total)}</strong></div><button className="primary-button" disabled>前往結帳 <ArrowUpRight size={17} /></button><p>結帳功能即將開放</p></div></>}
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
  const filtered = useMemo(() => products.filter(p => (category === 'all' || p.category === category) && (p.title + p.subtitle + p.categoryName).toLowerCase().includes(search.toLowerCase())), [category, search]);
  const addToCart = (product) => {
    setCart(items => {
      const found = items.find(x => x.id === product.id);
      return found ? items.map(x => x.id === product.id ? { ...x, quantity: x.quantity + 1 } : x) : [...items, { ...product, quantity: 1 }];
    });
    setCartOpen(true);
  };
  const changeCart = (id, delta) => setCart(items => items.map(x => x.id === id ? { ...x, quantity: x.quantity + delta } : x).filter(x => x.quantity > 0));
  const count = cart.reduce((s, x) => s + x.quantity, 0);

  return <main>
    <div className="announcement">一點手作，一點日常裡的小小喜歡 <span>✳</span></div>
    <header className="site-header">
      <a className="wordmark" href="#top"><span className="brand-mark">p.</span><span>PEACH GIRL<small>HANDMADE SELECT SHOP</small></span></a>
      <nav className="main-nav">
        <a href="#shop">全部商品</a><a href="#shop" onClick={() => setCategory('finished')}>手作手機鍊</a><a href="#shop" onClick={() => setCategory('charm')}>可愛萌粒</a><a href="#shop" onClick={() => setCategory('diy')}>DIY 材料</a>
      </nav>
      <div className="header-actions">
        <button className="icon-button" onClick={() => setShowSearch(v => !v)} aria-label="搜尋"><Search size={20} /></button>
        <button className="bag-button" onClick={() => setCartOpen(true)}><ShoppingBag size={19} /><span>購物袋</span>{count > 0 && <b>{count}</b>}</button>
      </div>
    </header>
    {showSearch && <div className="search-strip"><Search size={18} /><input autoFocus placeholder="搜尋喜歡的手作商品…" value={search} onChange={e => setSearch(e.target.value)} /><button onClick={() => {setSearch('');setShowSearch(false);}}><X size={17} /></button></div>}
    <section className="intro" id="top">
      <div className="intro-copy"><div className="eyebrow">SMALL THINGS, BIG JOY</div><h1>把日常，變成<br /><em>喜歡的樣子。</em></h1><p>從手作手機鍊到串珠材料，<br />挑一份讓生活更可愛的小心意。</p><a className="intro-link" href="#shop">逛逛所有商品 <ArrowUpRight size={17} /></a></div>
      <div className="intro-art"><div className="intro-circle circle-one" /><div className="intro-circle circle-two" /><div className="intro-flower">✿</div><span className="intro-note">made with<br />a little love</span><span className="intro-stamp">PEACH<br />GIRL</span></div>
    </section>
    <section className="shop-section" id="shop">
      <div className="section-heading"><div><div className="eyebrow">FIND YOUR FAVORITE</div><h2>探索手作選物</h2><p>每一件小物，都有自己的可愛細節。</p></div><span className="item-count">{filtered.length} ITEMS</span></div>
      <div className="shop-toolbar"><div className="category-list">{categories.map(c => <button key={c.id} className={category === c.id ? 'category-chip active' : 'category-chip'} onClick={() => setCategory(c.id)}>{c.label}</button>)}</div><div className="inline-search"><Search size={16} /><input placeholder="搜尋商品" value={search} onChange={e => setSearch(e.target.value)} /></div></div>
      {filtered.length ? <div className="product-grid">{filtered.map(p => <ProductCard key={p.id} product={p} onOpen={setSelected} onAdd={addToCart} />)}</div> : <div className="no-results">找不到符合的商品，試試其他關鍵字。</div>}
    </section>
    <section className="small-note"><span>✳</span><div><strong>MADE WITH CARE</strong><p>用心挑選材料，慢慢完成每一份手作。</p></div><span>PEACH GIRL · TAIWAN</span></section>
    <footer className="site-footer"><a className="wordmark" href="#top"><span className="brand-mark">p.</span><span>PEACH GIRL<small>HANDMADE SELECT SHOP</small></span></a><span>© 2026 PEACH GIRL. MADE WITH LOVE.</span><a href="#top">BACK TO TOP ↑</a></footer>
    <ProductDialog product={selected} onClose={() => setSelected(null)} onAdd={addToCart} />
    <CartDrawer open={cartOpen} items={cart} onClose={() => setCartOpen(false)} onChange={changeCart} />
  </main>;
}
