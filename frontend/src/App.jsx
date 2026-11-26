import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, ShoppingBag, X, Plus, Minus, ArrowUpRight, Heart, Sun, Moon, SlidersHorizontal, Package, ShieldCheck, Sparkles, Check, Trash2, Tag, Truck, Star } from 'lucide-react';
import { categories } from './data/products.js';
import { callApi } from './services/api.js';

const money = n => new Intl.NumberFormat('zh-TW').format(Math.round(n));
const SHIPPING_THRESHOLD = 3000;
const PROMO_CODE = 'PEACH10';

function readGuestCart() {
  try { const value = JSON.parse(localStorage.getItem('peach-girl-guest-cart') || '[]'); return Array.isArray(value) ? value : []; }
  catch { return []; }
}

function readGuestWishlist() {
  try { const value = JSON.parse(localStorage.getItem('peach-girl-guest-wishlist') || localStorage.getItem('peach-girl-wishlist') || '[]'); return Array.isArray(value) ? value : []; }
  catch { return []; }
}

function mergeCartItems(...groups) {
  const merged = new Map();
  groups.flat().forEach(item => {
    if (!item?.id || !item?.quantity) return;
    const variantText = item.variantText || '';
    const key = String(item.id) + '-' + variantText;
    const previous = merged.get(key);
    merged.set(key, previous
      ? { ...previous, ...item, key, quantity: Math.min(99, previous.quantity + item.quantity) }
      : { ...item, key, variantText, quantity: Math.min(99, item.quantity) });
  });
  return [...merged.values()];
}

function ProductArtwork({ product, compact = false }) {
  const symbols = { 'pearl-bow':'✳','tulip-strap':'✿','camellia-wrist':'❀','moonstone-chain':'✧','amber-bear':'♡','charm-bear':'♧','charm-capybara':'☁','charm-bunny':'◌','charm-unicorn':'✦','diy-kit':'✂','diy-jar':'✿','diy-bag':'♡','hw-clasp':'⌁','hw-wire':'〰' };
  return <div className={'artwork artwork-' + product.category + (compact ? ' artwork-compact' : '')}>
    {product.imageUrl ? <img className="product-real-image" src={product.imageUrl} alt={product.title}/> : <><span className="artwork-orbit"/><span className="artwork-symbol">{symbols[product.svgType] || '✳'}</span><span className="artwork-caption">PEACH GIRL · HANDMADE</span><span className="artwork-number">{String(product.id).padStart(2,'0')}</span></>}
  </div>;
}

function ProductCard({ product, onOpen, onAdd, wished, onWish }) {
  return <article className="product-card glass-card" role="button" tabIndex={0} onClick={() => onOpen(product)} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onOpen(product); } }} aria-label={'查看 '+product.title}>
    <div className="product-visual">
      <ProductArtwork product={product}/>
      {product.badge && <span className="product-flag">{product.badge}</span>}
      <button className={'wish-button'+(wished?' wished':'')} onClick={e=>{e.stopPropagation();onWish(product.id)}} aria-label={wished?'取消收藏':'加入收藏'}><Heart size={17} fill={wished?'currentColor':'none'}/></button>
      <span className="quick-view">查看商品 <ArrowUpRight size={15}/></span>
    </div>
    <div className="product-info"><div className="product-category">{product.categoryName}</div>
      <button className="product-title" onClick={()=>onOpen(product)}>{product.title}</button>
      <div className="product-subtitle">{product.subtitle}</div>
      <div className="product-rating"><Star size={12} fill="currentColor"/><b>{product.rating?.toFixed(1) || '5.0'}</b><span>({product.reviewCount || 0})</span></div>
      <div className="product-bottom"><div><span className="product-price">NT$ {money(product.price)}</span>{product.originalPrice>product.price&&<del>NT$ {money(product.originalPrice)}</del>}</div><button className="add-button" onClick={e=>{e.stopPropagation();onAdd(product)}} aria-label="加入購物袋"><Plus size={17}/></button></div>
    </div>
  </article>;
}

function ProductDialog({ product, onClose, onAdd }) {
  const [variant,setVariant]=useState({});
  useEffect(()=>setVariant({}),[product]);
  if(!product)return null;
  return <div className="overlay modal-overlay" onMouseDown={onClose}><section className="product-dialog glass-sheet" onMouseDown={e=>e.stopPropagation()}>
    <div className="dialog-head"><span>{product.categoryName} · 商品規格與詳情</span><button className="icon-button" onClick={onClose} aria-label="關閉"><X size={17}/></button></div>
    <div className="dialog-body"><div className="dialog-art"><ProductArtwork product={product}/></div><div className="dialog-copy">
      <div className="eyebrow">PEACH GIRL · HANDMADE</div><h2>{product.title}</h2><p className="dialog-subtitle">{product.subtitle}</p>
      <div className="dialog-price">NT$ {money(product.price)} {product.originalPrice>product.price&&<del>NT$ {money(product.originalPrice)}</del>}</div>
      <div className="review-summary"><span>★★★★★</span><strong>{product.rating?.toFixed(1)||'5.0'}</strong><small>{product.reviewCount||0} 則評價 · 已售 {product.soldCount||0}</small></div>
      <p className="dialog-description">{product.description}</p>{product.specsInfo&&<div className="spec-note">{product.specsInfo}</div>}
      {product.variants?.map((group,i)=><fieldset className="variant-group" key={group.name}><legend>{group.name}</legend><div className="variant-options">{group.options.map(option=><button type="button" key={option} className={variant[i]===option?'variant active':'variant'} onClick={()=>setVariant(v=>({...v,[i]:option}))}>{option}</button>)}</div></fieldset>)}
      {product.reviews?.length>0&&<div className="review-list"><strong>買家分享</strong>{product.reviews.slice(0,2).map((r,i)=><div className="review-item" key={i}><div><b>{r.user}</b><small>{r.date}</small><span>{'★'.repeat(r.rating)}</span></div><p>{r.comment}</p></div>)}</div>}
      <button className="primary-button dialog-add" disabled={!product.inStock} onClick={()=>{onAdd(product,variant);onClose()}}>{product.inStock?'加入購物袋':'目前缺貨'} <ArrowUpRight size={17}/></button><p className="stock-note">{product.inStock?'現貨供應':'目前缺貨'} · {product.freeShippingEligible?'符合免運活動':'運費依購物袋計算'}</p>
    </div></div>
  </section></div>;
}

function CartDrawer({open,items,onClose,onChange,onRemove,onPromo,promoApplied,onCheckout}) {
  const subtotal=items.reduce((s,x)=>s+x.price*x.quantity,0), count=items.reduce((s,x)=>s+x.quantity,0);
  const progress=Math.min(100,Math.round(subtotal/SHIPPING_THRESHOLD*100)), remaining=Math.max(0,SHIPPING_THRESHOLD-subtotal);
  const discount=promoApplied?Math.round(subtotal*.1):0, shipping=subtotal===0||remaining===0?0:80, total=subtotal-discount+shipping;
  const [code,setCode]=useState('');
  if(!open)return null;
  return <><div className="cart-backdrop" onClick={onClose}/><aside className="cart-drawer glass-sheet">
    <div className="drawer-head"><div><div className="eyebrow">YOUR LITTLE FAVORITES</div><h2>購物袋 <span>({count})</span></h2><p>把喜歡的小物帶回家。</p></div><button className="icon-button" onClick={onClose} aria-label="關閉購物袋"><X size={17}/></button></div>
    <div className="shipping-progress"><div className="shipping-copy"><span>{remaining===0?'已達免運門檻，享免費配送':'再選購 NT$ '+money(remaining)+' 即可享免運'}</span><strong>{progress}%</strong></div><div className="progress-track"><span style={{width:progress+'%'}}/></div></div>
    {items.length===0?<div className="empty-cart"><ShoppingBag size={38}/><p>購物袋目前是空的</p><button className="text-link" onClick={onClose}>繼續逛逛 <ArrowUpRight size={15}/></button></div>:<>
      <div className="cart-items">{items.map(item=><div className="cart-item" key={item.key}><div className="cart-thumb"><ProductArtwork product={item} compact/></div><div className="cart-item-copy"><strong>{item.title}</strong>{item.variantText&&<small>{item.variantText}</small>}<span>NT$ {money(item.price)}</span><div className="quantity"><button onClick={()=>onChange(item.key,-1)} aria-label="減少數量"><Minus size={13}/></button><span>{item.quantity}</span><button onClick={()=>onChange(item.key,1)} aria-label="增加數量"><Plus size={13}/></button></div></div><button className="remove-item" onClick={()=>onRemove(item.key)} aria-label="移除商品"><Trash2 size={15}/></button></div>)}</div>
      <div className="cart-total"><div className="promo-row"><input value={code} onChange={e=>setCode(e.target.value)} placeholder="輸入優惠碼 PEACH10"/><button onClick={()=>onPromo(code)}>套用</button></div>{promoApplied&&<div className="promo-applied"><Tag size={13}/> PEACH10 已折抵 9 折</div>}
        <div className="total-line"><span>商品小計</span><b>NT$ {money(subtotal)}</b></div><div className="total-line"><span>配送運費</span><b>{shipping===0?'免費':'NT$ '+money(shipping)}</b></div>{promoApplied&&<div className="total-line discount"><span>優惠折抵</span><b>− NT$ {money(discount)}</b></div>}<div className="total-line total-final"><span>總計</span><b>NT$ {money(total)}</b></div>
        <button className="primary-button checkout-button" onClick={onCheckout}>前往結帳 <ArrowUpRight size={17}/></button><p className="checkout-note">目前為購物流程展示，尚未串接實際金流與訂單系統。</p>
      </div>
    </>}
  </aside></>;
}

function CheckoutDialog({open,total,onClose,onDone}) {
  const [step,setStep]=useState('form');
  useEffect(()=>{if(open)setStep('form')},[open]);
  if(!open)return null;
  return <div className="overlay" onMouseDown={onClose}><section className="checkout-dialog glass-sheet" onMouseDown={e=>e.stopPropagation()}>
    {step==='form'?<><div className="dialog-head"><strong>快速結帳</strong><button className="icon-button" onClick={onClose}><X size={17}/></button></div><form className="checkout-form" onSubmit={e=>{e.preventDefault();setStep('success')}}>
      <label>收件人姓名<input required placeholder="請輸入姓名"/></label><label>聯絡電話<input required type="tel" placeholder="請輸入聯絡電話"/></label><label>配送地址<input required placeholder="請輸入完整配送地址"/></label>
      <div className="payment-choice"><span>選擇付款方式</span><label><input type="radio" name="payment" defaultChecked/> Apple Pay</label><label><input type="radio" name="payment"/> 信用卡一次付清</label></div>
      <div className="checkout-amount"><span>應付總金額</span><b>NT$ {money(total)}</b></div><button className="primary-button" type="submit">確認付款並下單 <Check size={16}/></button>
      <p className="checkout-note">展示流程，不會實際扣款或建立訂單。</p></form></>:<div className="checkout-success"><span><Check size={38}/></span><h2>訂單已確認</h2><p>這是結帳流程示範，尚未產生真實訂單或付款。</p><button className="primary-button" onClick={onDone}>完成並繼續瀏覽</button></div>}
  </section></div>;
}

function MemberDialog({open,onClose,onSubmit,loading,error}) {
  const [mode,setMode]=useState('login');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [confirm,setConfirm]=useState('');
  const [displayName,setDisplayName]=useState('');
  const [phone,setPhone]=useState('');
  useEffect(()=>{if(open){setMode('login');setPassword('');setConfirm('')}},[open]);
  if(!open)return null;
  const submit=e=>{e.preventDefault();if(mode==='register'&&password!==confirm)return;onSubmit({mode,email,password,displayName,phone})};
  return <div className="overlay" onMouseDown={onClose}><section className="member-dialog glass-sheet" onMouseDown={e=>e.stopPropagation()}>
    <div className="dialog-head"><div><div className="eyebrow">PEACH GIRL MEMBER</div><strong>{mode==='login'?'會員登入':'建立會員帳號'}</strong></div><button className="icon-button" onClick={onClose} aria-label="關閉"><X size={17}/></button></div>
    <div className="member-tabs"><button className={mode==='login'?'active':''} onClick={()=>setMode('login')}>登入</button><button className={mode==='register'?'active':''} onClick={()=>setMode('register')}>註冊</button></div>
    <form className="member-form" onSubmit={submit}>
      {mode==='register'&&<label>會員稱呼<input required maxLength={40} value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="請輸入稱呼"/></label>}
      <label>電子郵件<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com"/></label>
      {mode==='register'&&<label>聯絡電話（選填）<input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="請輸入聯絡電話"/></label>}
      <label>密碼<input required type="password" minLength={mode==='register'?12:1} autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder={mode==='register'?'至少 12 個字元':'請輸入密碼'}/></label>
      {mode==='register'&&<label>確認密碼<input required type="password" minLength={12} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="再次輸入密碼"/></label>}
      {mode==='register'&&<p className="member-hint">密碼至少 12 個字元。請使用不會與其他網站共用的密碼。</p>}
      {mode==='register'&&confirm&&password!==confirm&&<p className="member-error">兩次輸入的密碼不一致。</p>}
      {error&&<p className="member-error" role="alert">{error}</p>}
      <button className="primary-button" type="submit" disabled={loading||(mode==='register'&&password!==confirm)}>{loading?'處理中…':mode==='login'?'登入會員':'建立會員帳號'} <ArrowUpRight size={16}/></button>
    </form>
  </section></div>;
}

export default function App(){
  const [products,setProducts]=useState([]),[productsLoading,setProductsLoading]=useState(true),[productsError,setProductsError]=useState('');
  const [category,setCategory]=useState('all'),[search,setSearch]=useState(''),[selected,setSelected]=useState(null),[cartOpen,setCartOpen]=useState(false),[cart,setCart]=useState(readGuestCart),[sortBy,setSortBy]=useState('featured'),[onlyWishlist,setOnlyWishlist]=useState(false);
  const [catalogVisible,setCatalogVisible]=useState(false);
  const [member,setMember]=useState(null),[memberToken,setMemberToken]=useState(()=>localStorage.getItem('peach-girl-member-token')||''),[memberOpen,setMemberOpen]=useState(false),[memberLoading,setMemberLoading]=useState(false),[memberError,setMemberError]=useState('');
  const [commerceReady,setCommerceReady]=useState(()=>!localStorage.getItem('peach-girl-member-token'));
  const commerceSaveQueue=useRef(Promise.resolve());
  const [wishlist,setWishlist]=useState(readGuestWishlist);
  const [dark,setDark]=useState(()=>localStorage.getItem('peach-girl-theme')==='dark'),[toast,setToast]=useState(''),[promoApplied,setPromoApplied]=useState(false),[checkoutOpen,setCheckoutOpen]=useState(false),[checkoutTotal,setCheckoutTotal]=useState(0);
  useEffect(()=>{
    let cancelled=false;
    if(!memberToken){setMember(null);setCommerceReady(true);return()=>{cancelled=true};}
    setCommerceReady(false);
    if(productsLoading)return()=>{cancelled=true};
    (async()=>{
      try{
        const profile=await callApi('memberGet',{},memberToken);
        const remote=await callApi('memberGetCommerce',{},memberToken);
        if(cancelled)return;
        setMember(profile);
        const remoteCart=(remote.cart||[]).map(item=>{
          const product=products.find(p=>String(p.id)===String(item.productId));
          return product?{...product,key:String(product.id)+'-'+(item.variantText||''),variantText:item.variantText||'',quantity:Number(item.quantity)||1}:null;
        }).filter(Boolean);
        setCart(mergeCartItems(cart,remoteCart));
        setWishlist([...new Set([...wishlist,...(remote.wishlist||[]).map(String)])]);
        setCommerceReady(true);
      }catch(error){
        if(cancelled)return;
        localStorage.removeItem('peach-girl-member-token');
        setMemberToken('');
        setMember(null);
        setCommerceReady(true);
        notify(error?.message||'會員資料載入失敗，請重新登入');
      }
    })();
    return()=>{cancelled=true};
  },[memberToken,productsLoading]);
  useEffect(()=>{callApi('getProducts').then(items=>{if(Array.isArray(items)){setProducts(items);setProductsError('');}else{setProductsError('商品 API 回傳格式不正確，請檢查後端回應。');}}).catch(error=>{setProducts([]);setProductsError(error?.message||'商品載入失敗，請稍後再試。');}).finally(()=>setProductsLoading(false));},[]);
  useEffect(()=>{document.documentElement.classList.toggle('dark',dark);localStorage.setItem('peach-girl-theme',dark?'dark':'light')},[dark]);
  useEffect(()=>{
    if(memberToken)return;
    localStorage.setItem('peach-girl-guest-cart',JSON.stringify(cart));
    localStorage.setItem('peach-girl-guest-wishlist',JSON.stringify(wishlist));
    localStorage.setItem('peach-girl-wishlist',JSON.stringify(wishlist));
  },[cart,wishlist,memberToken]);
  useEffect(()=>{
    if(!memberToken||!commerceReady)return;
    const payload={
      wishlist:wishlist.map(String),
      cart:cart.map(item=>({productId:String(item.id),variantText:item.variantText||'',quantity:item.quantity}))
    };
    const timer=window.setTimeout(()=>{
      commerceSaveQueue.current=commerceSaveQueue.current
        .catch(()=>{})
        .then(()=>callApi('memberSaveCommerce',payload,memberToken))
        .catch(error=>notify(error?.message||'購物車與收藏同步失敗，請稍後再試'));
    },500);
    return()=>window.clearTimeout(timer);
  },[cart,wishlist,memberToken,commerceReady]);
  useEffect(()=>{const catalog=document.getElementById('catalog');if(!catalog)return;const updateVisibility=()=>{const rect=catalog.getBoundingClientRect();setCatalogVisible(rect.top<window.innerHeight&&rect.bottom>145)};updateVisibility();window.addEventListener('scroll',updateVisibility,{passive:true});window.addEventListener('resize',updateVisibility);return()=>{window.removeEventListener('scroll',updateVisibility);window.removeEventListener('resize',updateVisibility)}},[]);
  const filtered=useMemo(()=>{let list=products.filter(p=>(category==='all'||p.category===category)&&(!onlyWishlist||wishlist.map(String).includes(String(p.id)))&&(p.title+p.subtitle+p.categoryName+p.description).toLowerCase().includes(search.trim().toLowerCase()));if(sortBy==='price-asc')list=[...list].sort((a,b)=>a.price-b.price);if(sortBy==='price-desc')list=[...list].sort((a,b)=>b.price-a.price);return list},[products,category,search,onlyWishlist,wishlist,sortBy]);
  const submitMember=async({mode,email,password,displayName,phone})=>{setMemberLoading(true);setMemberError('');try{const result=await callApi(mode==='register'?'memberRegister':'memberLogin',mode==='register'?{email,password,displayName,phone}:{email,password});setCommerceReady(false);localStorage.setItem('peach-girl-member-token',result.token);setMemberToken(result.token);setMember(result.member);setMemberOpen(false);notify(mode==='register'?'會員註冊成功':'登入成功');}catch(error){setMemberError(error?.message||'操作失敗，請稍後再試');}finally{setMemberLoading(false)}};
  const logoutMember=async()=>{try{await commerceSaveQueue.current;await callApi('memberLogout',{},memberToken)}catch{}localStorage.removeItem('peach-girl-member-token');setMemberToken('');setMember(null);setCommerceReady(true);setCart(readGuestCart());setWishlist(readGuestWishlist());notify('已登出會員帳號')};
  const notify=message=>{setToast(message);window.clearTimeout(window.__peachToastTimer);window.__peachToastTimer=window.setTimeout(()=>setToast(''),2400)};
  const addToCart=(product,variants={})=>{if(!product.inStock){notify('這項商品目前缺貨');return}const variantText=Object.entries(variants).map(([i,v])=>product.variants?.[Number(i)]?.name+'：'+v).join(' / ');const key=product.id+'-'+variantText;setCart(items=>{const old=items.find(x=>x.key===key);return old?items.map(x=>x.key===key?{...x,quantity:x.quantity+1}:x):[...items,{...product,key,variantText,quantity:1}]});setCartOpen(true);notify('已加入購物袋')};
  const changeCart=(key,delta)=>setCart(items=>items.map(x=>x.key===key?{...x,quantity:x.quantity+delta}:x).filter(x=>x.quantity>0));
  const removeCart=key=>setCart(items=>items.filter(x=>x.key!==key));
  const toggleWish=id=>setWishlist(items=>{const normalized=String(id);const exists=items.map(String).includes(normalized);notify(exists?'已取消收藏':'已加入收藏');return exists?items.filter(x=>String(x)!==normalized):[...items,normalized]});
  const resetFilters=()=>{setCategory('all');setSearch('');setSortBy('featured');setOnlyWishlist(false)};
  const subtotal=cart.reduce((s,x)=>s+x.price*x.quantity,0),discount=promoApplied?Math.round(subtotal*.1):0,shipping=subtotal===0||subtotal>=SHIPPING_THRESHOLD?0:80,total=subtotal-discount+shipping,count=cart.reduce((s,x)=>s+x.quantity,0);
  const hero=products[0],categoryTitle=onlyWishlist?'我的收藏清單':categories.find(c=>c.id===category)?.label||'全部精選設計';
  const applyPromo=code=>{if(code.trim().toUpperCase()==='PEACH10'){setPromoApplied(true);notify('優惠碼已套用')}else notify('優惠碼無效，請確認後再試')};
  const startCheckout=()=>{setCheckoutTotal(total);setCartOpen(false);setCheckoutOpen(true)};
  return <div className="app-shell" id="top">
    <div className="ambient ambient-one"/><div className="ambient ambient-two"/><div className="ambient ambient-three"/>
    <div className="announcement"><Sparkles size={13}/> 把喜歡的日常，慢慢串成喜歡的樣子。</div>
    <header className="site-header">
      <a className="wordmark" href="#top" onClick={resetFilters}><span className="brand-mark">p.</span><span>PEACH GIRL<small>HANDMADE SELECT SHOP</small></span></a>
      <nav className={'main-nav '+(catalogVisible?'category-visible':'category-hidden')} aria-hidden={!catalogVisible}>{categories.map(c=><button key={c.id} className={category===c.id&&!onlyWishlist?'nav-active':''} onClick={()=>{setCategory(c.id);setOnlyWishlist(false)}}>{c.label}</button>)}</nav>
      <div className="header-actions"><label className="header-search"><Search size={16}/><input placeholder="搜尋手作選物..." value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button onClick={()=>setSearch('')} aria-label="清除搜尋"><X size={13}/></button>}</label>
        {member?<button className="member-entry signed-in" onClick={logoutMember} title="點擊登出">{member.displayName} · 登出</button>:<button className="member-entry" onClick={()=>{setMemberError('');setMemberOpen(true)}}>會員登入</button>}
        <button className="icon-button theme-button" onClick={()=>setDark(v=>!v)} aria-label="切換深淺色">{dark?<Sun size={18}/>:<Moon size={18}/>}</button>
        <button className="icon-button" onClick={()=>{setOnlyWishlist(v=>!v);document.getElementById('catalog')?.scrollIntoView({behavior:'smooth'})}} aria-label="我的收藏"><Heart size={18}/></button>
        <button className="bag-button" onClick={()=>setCartOpen(true)}><ShoppingBag size={17}/><span>購物袋</span><b>{count}</b></button></div>
      <nav className={'mobile-category-nav '+(catalogVisible?'category-visible':'category-hidden')} aria-hidden={!catalogVisible}>{categories.map(c=><button key={c.id} className={category===c.id&&!onlyWishlist?'active':''} onClick={()=>{setCategory(c.id);setOnlyWishlist(false)}}>{c.label}</button>)}</nav>
    </header>
    <main className="page-content">
      <section className="hero glass-card"><div className="hero-glow"/><div className="hero-copy">
        <div className="hero-tag"><span/> PEACH GIRL · HANDMADE COLLECTION</div><h1>把喜歡的日常，<br/><em>慢慢串成喜歡的樣子。</em></h1>
        <p>從一顆珠子、一條手機鍊，到親手完成的小作品。<br/>讓每一份細節，都成為生活裡剛剛好的溫柔。</p>
        <div className="hero-pills"><span>手作手機鍊</span><span>可愛萌粒</span><span>DIY 串珠材料</span></div>
        <div className="hero-actions"><a className="primary-button" href="#catalog">探索手作選物 <ArrowUpRight size={17}/></a><button className="secondary-button" onClick={()=>{setCategory('finished');setOnlyWishlist(false);document.getElementById('catalog')?.scrollIntoView({behavior:'smooth'})}}>人氣手機鍊</button></div>
      </div>{hero&&<button className="hero-art" onClick={()=>setSelected(hero)} aria-label={'查看 '+hero.title}><ProductArtwork product={hero}/><span className="hero-product-chip"><span><strong>{hero.title}</strong><small>人氣手作 · NT$ {money(hero.price)}</small></span><ArrowUpRight size={19}/></span></button>}</section>
      <section className="catalog-section" id="catalog"><div className="catalog-heading"><div><div className="eyebrow">FIND YOUR LITTLE FAVORITE</div><h2>{categoryTitle}</h2><p>探索手作選物，收藏生活裡剛剛好的溫柔。</p></div><div className="catalog-tools"><button className={'wishlist-filter'+(onlyWishlist?' active':'')} onClick={()=>setOnlyWishlist(v=>!v)}><Heart size={15} fill={onlyWishlist?'currentColor':'none'}/> 我的收藏</button><label className="sort-select"><SlidersHorizontal size={14}/><select value={sortBy} onChange={e=>setSortBy(e.target.value)}><option value="featured">精選推薦</option><option value="price-asc">價格：由低到高</option><option value="price-desc">價格：由高到低</option></select></label></div></div>
        <div className="catalog-subbar"><span className="item-count">共 {filtered.length} 件作品</span></div>
        {productsLoading?<div className="empty-state">正在載入商品...</div>:productsError?<div className="empty-state"><Package size={27}/><h3>商品載入失敗</h3><p>{productsError}</p></div>:filtered.length?<div className="product-grid">{filtered.map(p=><ProductCard key={p.id} product={p} onOpen={setSelected} onAdd={addToCart} wished={wishlist.map(String).includes(String(p.id))} onWish={toggleWish}/>)}</div>:<div className="empty-state"><Search size={27}/><h3>找不到相符的商品</h3><p>試試其他關鍵字，或重設篩選條件。</p><button className="secondary-button" onClick={resetFilters}>顯示全部商品</button></div>}
      </section>
      <section className="service-row"><div className="service-card glass-card"><span className="service-icon"><Package/></span><div><strong>用心包裝每份心意</strong><p>讓每件手作，都有值得期待的開箱時刻。</p></div></div><div className="service-card glass-card"><span className="service-icon"><ShieldCheck/></span><div><strong>細節與品質把關</strong><p>仔細挑選材料，慢慢完成每一份作品。</p></div></div><div className="service-card glass-card"><span className="service-icon"><Truck/></span><div><strong>滿 NT$3,000 享免運</strong><p>把喜歡的小物一次帶回家。</p></div></div></section>
    </main>
    <footer className="site-footer"><a className="wordmark" href="#top"><span className="brand-mark">p.</span><span>PEACH GIRL<small>HANDMADE SELECT SHOP</small></span></a><span>© 2026 PEACH GIRL · MADE WITH LOVE.</span><a href="#top">BACK TO TOP ↑</a></footer>
    <MemberDialog open={memberOpen} onClose={()=>setMemberOpen(false)} onSubmit={submitMember} loading={memberLoading} error={memberError}/>
    <ProductDialog product={selected} onClose={()=>setSelected(null)} onAdd={addToCart}/>
    <CartDrawer open={cartOpen} items={cart} onClose={()=>setCartOpen(false)} onChange={changeCart} onRemove={removeCart} onPromo={applyPromo} promoApplied={promoApplied} onCheckout={startCheckout}/>
    <CheckoutDialog open={checkoutOpen} total={checkoutTotal} onClose={()=>setCheckoutOpen(false)} onDone={()=>{setCheckoutOpen(false);setCart([]);setPromoApplied(false);notify('感謝體驗 Peach Girl')}}/>
    {toast&&<div className="dynamic-island"><span><Check size={13}/></span>{toast}</div>}
  </div>;
}
