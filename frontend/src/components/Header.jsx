import { Search, ShoppingBag, Heart } from 'lucide-react';

export default function Header({ cartCount, keyword, onSearch }) {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="蜜桃女孩手作工作室首頁">
        <span className="brand-mark">桃</span>
        <span><strong>蜜桃女孩</strong><small>手作工作室</small></span>
      </a>
      <label className="search-box">
        <Search size={17} />
        <input value={keyword} onChange={(event) => onSearch(event.target.value)} placeholder="搜尋手機鍊、萌粒、DIY 材料…" />
      </label>
      <div className="header-actions">
        <button className="icon-button" type="button" aria-label="收藏"><Heart size={19} /></button>
        <button className="cart-button" type="button"><ShoppingBag size={17} /> 購物袋 <span>{cartCount}</span></button>
      </div>
    </header>
  );
}
