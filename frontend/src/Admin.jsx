import { useEffect, useState } from 'react';
import { ArrowLeft, ImagePlus, LogOut, PackagePlus, Pencil, Power, Save, ShieldCheck, X } from 'lucide-react';
import { callApi } from './services/api.js';
import './styles/admin.css';

const blank = { id:'',title:'',subtitle:'',category:'finished',price:'',originalPrice:'',description:'',imageUrl:'',inStock:true };
const categories = [{id:'finished',label:'手工成品手機鍊'},{id:'charm',label:'手作萌粒公仔'},{id:'diy',label:'DIY 串珠材料包'},{id:'hardware',label:'五金扣環配件'}];

export default function Admin() {
  const [token,setToken]=useState(()=>sessionStorage.getItem('peach-admin-token')||'');
  const [username,setUsername]=useState(''),[password,setPassword]=useState('');
  const [products,setProducts]=useState([]),[form,setForm]=useState(blank);
  const [busy,setBusy]=useState(false),[uploading,setUploading]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const editing=Boolean(form.id);
  const update=(key,value)=>setForm(current=>({...current,[key]:value}));
  const flash=message=>{setNotice(message);window.setTimeout(()=>setNotice(''),2500);};
  async function load(activeToken=token){setProducts(await callApi('adminListProducts',{},activeToken)||[]);}
  useEffect(()=>{if(token) load().catch(()=>{sessionStorage.removeItem('peach-admin-token');setToken('');});},[]);
  async function login(e){e.preventDefault();setBusy(true);setError('');try{const r=await callApi('adminLogin',{username,password});sessionStorage.setItem('peach-admin-token',r.token);setToken(r.token);setPassword('');await load(r.token);}catch(e){setError(e.message);}finally{setBusy(false);}}
  async function logout(){try{await callApi('adminLogout',{},token);}catch{}sessionStorage.removeItem('peach-admin-token');setToken('');setProducts([]);}
  function edit(p){setForm({...blank,...p,price:String(p.price),originalPrice:String(p.originalPrice||'')});window.scrollTo({top:0,behavior:'smooth'});}
  async function upload(file){
    if(!file)return;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)){setError('圖片僅支援 JPG、PNG、WebP');return;}
    if(file.size>4*1024*1024){setError('圖片不可超過 4 MB');return;}
    setUploading(true);setError('');
    try{
      const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file);});
      const r=await callApi('uploadProductImage',{fileName:file.name,mimeType:file.type,base64},token);
      update('imageUrl',r.imageUrl);flash('圖片上傳完成');
    }catch(e){setError(e.message);}finally{setUploading(false);}
  }
  async function save(e){e.preventDefault();setBusy(true);setError('');try{
    await callApi('saveProduct',{...form,price:Number(form.price),originalPrice:Number(form.originalPrice||form.price),categoryName:categories.find(c=>c.id===form.category)?.label||'手作選物'},token);
    await load();setForm(blank);flash('商品已儲存');
  }catch(e){setError(e.message);}finally{setBusy(false);}}
  async function toggle(p){try{await callApi('setProductStatus',{id:p.id,status:p.status==='active'?'inactive':'active'},token);await load();flash(p.status==='active'?'商品已下架':'商品已上架');}catch(e){setError(e.message);}}
  if(!token)return <main className="admin-login-shell"><a className="admin-back" href="./"><ArrowLeft size={16}/> 返回商店</a><section className="admin-login-card"><span className="admin-logo">p.</span><div className="admin-eyebrow">PEACH GIRL · PRIVATE ACCESS</div><h1>商品管理</h1><p>使用自訂管理員帳號登入，不需要 Google 帳號。</p><form onSubmit={login}><label>管理員帳號<input autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} required/></label><label>管理員密碼<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>{error&&<div className="admin-error">{error}</div>}<button className="admin-primary" disabled={busy}>{busy?'登入中…':'登入管理後台'} <ShieldCheck size={16}/></button></form></section></main>;
  return <main className="admin-shell"><header className="admin-topbar"><a className="admin-brand" href="./"><span className="admin-logo">p.</span><span>PEACH GIRL<small>STORE MANAGEMENT</small></span></a><div><span className="admin-secure"><ShieldCheck size={14}/> 管理員模式</span><button className="admin-logout" onClick={logout}><LogOut size={15}/> 登出</button></div></header><div className="admin-content">
    <div className="admin-heading"><div><div className="admin-eyebrow">PRODUCT MANAGEMENT</div><h1>商品管理</h1><p>新增商品、調整商品資訊與上下架狀態。</p></div><span className="admin-count">{products.length} 件商品</span></div>
    {error&&<div className="admin-error">{error}</div>}{notice&&<div className="admin-notice">{notice}</div>}
    <div className="admin-layout"><section className="admin-panel"><div className="admin-panel-title"><div><span>{editing?'EDIT PRODUCT':'NEW PRODUCT'}</span><h2>{editing?'編輯商品':'新增商品'}</h2></div>{editing&&<button className="admin-cancel" onClick={()=>setForm(blank)}><X size={15}/> 取消</button>}</div>
      <form className="admin-form" onSubmit={save}>
        <label>商品名稱<input value={form.title} onChange={e=>update('title',e.target.value)} required placeholder="輸入商品名稱"/></label>
        <label>商品副標題<input value={form.subtitle} onChange={e=>update('subtitle',e.target.value)} placeholder="簡短描述商品特色"/></label>
        <div className="admin-field-row"><label>商品分類<select value={form.category} onChange={e=>update('category',e.target.value)}>{categories.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></label><label>商品售價<input type="number" min="0" step="1" value={form.price} onChange={e=>update('price',e.target.value)} required/></label></div>
        <label>原價（選填）<input type="number" min="0" value={form.originalPrice} onChange={e=>update('originalPrice',e.target.value)} placeholder="未填則與售價相同"/></label>
        <label>商品介紹<textarea rows="5" value={form.description} onChange={e=>update('description',e.target.value)} placeholder="輸入商品材質、特色與注意事項…"/></label>
        <div className="admin-image-field"><div><strong>商品圖片</strong><small>JPG、PNG、WebP，單張上限 4 MB</small></div><label className="admin-upload-button"><ImagePlus size={16}/>{uploading?'上傳中…':'選擇圖片'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>upload(e.target.files?.[0])} disabled={uploading}/></label></div>
        {form.imageUrl&&<div className="admin-image-preview"><img src={form.imageUrl} alt="商品預覽"/><button type="button" onClick={()=>update('imageUrl','')}>移除圖片</button></div>}
        <label className="admin-check"><input type="checkbox" checked={form.inStock} onChange={e=>update('inStock',e.target.checked)}/> 商品有庫存</label>
        <button className="admin-primary" disabled={busy||uploading}><Save size={16}/>{busy?'儲存中…':editing?'儲存修改':'新增商品'}</button>
      </form>
    </section><section className="admin-panel"><div className="admin-panel-title"><div><span>YOUR COLLECTION</span><h2>商品列表</h2></div><button className="admin-refresh" onClick={()=>load()}><PackagePlus size={15}/> 重新整理</button></div>
      {!products.length?<div className="admin-empty">目前還沒有商品，先新增第一件作品。</div>:<div className="admin-table">{products.map(p=><article className="admin-product-row" key={p.id}><div className="admin-product-thumb">{p.imageUrl?<img src={p.imageUrl} alt=""/>:<span>p.</span>}</div><div className="admin-product-copy"><strong>{p.title}</strong><small>{p.categoryName} · NT$ {Number(p.price).toLocaleString('zh-TW')}</small><span className={p.status==='active'?'status-active':'status-inactive'}>{p.status==='active'?'上架中':'已下架'}</span></div><div className="admin-row-actions"><button onClick={()=>edit(p)} aria-label="編輯商品"><Pencil size={15}/></button><button onClick={()=>toggle(p)} aria-label="切換上下架"><Power size={15}/></button></div></article>)}</div>}
    </section></div></div></main>;
}