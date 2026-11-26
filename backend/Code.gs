var PRODUCT_HEADERS = ['product_id','title','subtitle','category','category_name','price','original_price','description','status','image_url','in_stock','created_at','updated_at'];

var STORE_SHEETS = {
  Products: PRODUCT_HEADERS,
  Categories: ['category_id','name','slug','description','sort_order','status','created_at','updated_at'],
  ProductImages: ['image_id','product_id','file_id','image_url','alt_text','sort_order','is_primary','created_at'],
  ProductVariants: ['variant_id','product_id','variant_name','option_name','option_value','price_adjustment','sku','status','created_at','updated_at'],
  Inventory: ['inventory_id','product_id','variant_id','quantity','reserved_quantity','updated_at'],
  Members: ['member_id','username','email','password_hash','password_salt','display_name','phone','status','created_at','updated_at','last_login_at'],
  Orders: ['order_id','member_id','order_number','order_status','subtotal','discount_amount','shipping_fee','total_amount','recipient_name','recipient_phone','shipping_address','customer_note','created_at','updated_at'],
  OrderItems: ['order_item_id','order_id','product_id','variant_id','product_title','variant_description','unit_price','quantity','line_total','created_at'],
  Favorites: ['favorite_id','member_id','product_id','created_at'],
  Payments: ['payment_id','order_id','payment_method','payment_status','amount','transaction_id','paid_at','created_at','updated_at'],
  Shipments: ['shipment_id','order_id','carrier','tracking_number','shipping_status','shipped_at','delivered_at','created_at','updated_at'],
  Admins: ['admin_id','username','display_name','role','status','created_at','updated_at','last_login_at']
};

function doGet(e) {
  if (e && e.parameter && e.parameter.bridge === '1') {
    return HtmlService.createHtmlOutputFromFile('Bridge')
      .setTitle('Peach Girl Store API Bridge')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  return jsonResponse_({success:true,data:{service:'Peach Girl Store API',status:'ready'},message:'success'});
}

/**
 * Called by the trusted storefront iframe through google.script.run.
 * Keep this function public (no trailing underscore) for google.script.run.
 */
function bridgeCall(request) {
  try {
    var req = request || {};
    var d = req.data || {}, result;
    switch (req.action) {
      case 'getProducts': result = readProducts_().filter(function(p){return p.status==='active';}).map(publicProduct_); break;
      case 'adminLogin': result = login_(d); break;
      case 'adminListProducts': requireAdmin_(req.token); result = readProducts_().map(publicProduct_); break;
      case 'saveProduct': requireAdmin_(req.token); result = saveProduct_(d); break;
      case 'setProductStatus': requireAdmin_(req.token); result = setStatus_(d); break;
      case 'uploadProductImage': requireAdmin_(req.token); result = uploadImage_(d); break;
      case 'adminLogout': if(req.token) CacheService.getScriptCache().remove('admin_'+hash_(req.token)); result={loggedOut:true}; break;
      default: throw new Error('不支援的 API：'+req.action);
    }
    return {success:true,data:result,message:'success'};
  } catch(err) {
    return {success:false,data:null,message:err.message || 'API 執行失敗'};
  }
}
function doPost(e) {
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var d = req.data || {}, result;
    switch (req.action) {
      case 'getProducts': result = readProducts_().filter(function(p){return p.status==='active';}).map(publicProduct_); break;
      case 'adminLogin': result = login_(d); break;
      case 'adminListProducts': requireAdmin_(req.token); result = readProducts_().map(publicProduct_); break;
      case 'saveProduct': requireAdmin_(req.token); result = saveProduct_(d); break;
      case 'setProductStatus': requireAdmin_(req.token); result = setStatus_(d); break;
      case 'uploadProductImage': requireAdmin_(req.token); result = uploadImage_(d); break;
      case 'adminLogout': if(req.token) CacheService.getScriptCache().remove('admin_'+hash_(req.token)); result={loggedOut:true}; break;
      default: throw new Error('不支援的 API：'+req.action);
    }
    return jsonResponse_({success:true,data:result,message:'success'});
  } catch(err) {
    return jsonResponse_({success:false,data:null,message:err.message || 'API 執行失敗'});
  }
}
function initializeStore() {
  var id=PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if(!id) throw new Error('請先設定指令碼屬性 SPREADSHEET_ID');
  var ss=SpreadsheetApp.openById(id), created=[];
  Object.keys(STORE_SHEETS).forEach(function(name) {
    var sh=ss.getSheetByName(name);
    if(!sh) { sh=ss.insertSheet(name); created.push(name); }
    if(sh.getLastRow()===0) sh.getRange(1,1,1,STORE_SHEETS[name].length).setValues([STORE_SHEETS[name]]);
  });
  Logger.log('資料庫初始化完成。新建工作表：'+(created.join(', ')||'無')+'；資料庫：'+ss.getUrl());
}
/* 初次設定：先填入自己的帳號與至少 12 字元密碼，執行一次後立即刪除明文密碼。 */
function setInitialAdmin() {
  configureAdmin_('CHANGE_USERNAME','CHANGE_TO_A_LONG_RANDOM_PASSWORD');
}
function configureAdmin_(username,password) {
  if(!username || !password || username.indexOf('CHANGE_')===0 || password.indexOf('CHANGE_')===0) throw new Error('請先修改 setInitialAdmin() 的帳號密碼');
  if(password.length<12) throw new Error('密碼至少需要 12 個字元');
  var salt=Utilities.getUuid();
  PropertiesService.getScriptProperties().setProperties({ADMIN_USERNAME:username,ADMIN_SALT:salt,ADMIN_PASSWORD_HASH:passwordHash_(password,salt)});
  Logger.log('管理員帳密設定完成，請移除 setInitialAdmin() 內的明文密碼。');
}
function login_(d) {
  var p=PropertiesService.getScriptProperties(), u=p.getProperty('ADMIN_USERNAME'), s=p.getProperty('ADMIN_SALT'), h=p.getProperty('ADMIN_PASSWORD_HASH');
  if(!u || !s || !h) throw new Error('管理員尚未完成初始設定');
  if(String(d.username||'')!==u || passwordHash_(String(d.password||''),s)!==h) { Utilities.sleep(500); throw new Error('帳號或密碼錯誤'); }
  var token=Utilities.getUuid()+Utilities.getUuid();
  CacheService.getScriptCache().put('admin_'+hash_(token),'1',21600);
  return {token:token,expiresIn:21600};
}
function requireAdmin_(token) {
  if(!token || CacheService.getScriptCache().get('admin_'+hash_(token))!=='1') throw new Error('登入已逾時，請重新登入');
}
function passwordHash_(password,salt) {
  var value=salt+':'+password;
  for(var i=0;i<10000;i++) value=Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,value,Utilities.Charset.UTF_8));
  return value;
}
function hash_(value) {
  return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,value,Utilities.Charset.UTF_8)).replace(/=+$/g,'');
}
function productSheet_() {
  var id=PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if(!id) throw new Error('請設定指令碼屬性 SPREADSHEET_ID');
  var sh=SpreadsheetApp.openById(id).getSheetByName('Products');
  if(!sh) throw new Error('找不到 Products 工作表，請先執行 initializeStore()');
  return sh;
}
function readProducts_() {
  var v=productSheet_().getDataRange().getValues();
  if(v.length<2) return [];
  var headers=v[0].map(String);
  return v.slice(1).filter(function(r){return r[0];}).map(function(r){
    var o={}; headers.forEach(function(k,i){o[k]=r[i];}); return o;
  });
}
function publicProduct_(p) {
  return {id:String(p.product_id),title:String(p.title||''),subtitle:String(p.subtitle||''),category:String(p.category||'finished'),categoryName:String(p.category_name||'手作選物'),price:Number(p.price)||0,originalPrice:Number(p.original_price)||Number(p.price)||0,description:String(p.description||''),imageUrl:String(p.image_url||''),inStock:String(p.in_stock).toLowerCase()!=='false',status:String(p.status||'active'),badge:'',rating:5,reviewCount:0,soldCount:0,freeShippingEligible:true,variants:[],reviews:[]};
}
function saveProduct_(d) {
  var title=String(d.title||'').trim(), category=String(d.category||'').trim(), price=Number(d.price);
  if(!title) throw new Error('請輸入商品名稱');
  if(!category) throw new Error('請選擇商品分類');
  if(!Number.isFinite(price)||price<0) throw new Error('商品價格不正確');
  var sh=productSheet_(), lock=LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var rows=sh.getDataRange().getValues(), id=String(d.id||''), row=-1, now=new Date();
    if(id) {
      for(var i=1;i<rows.length;i++) if(String(rows[i][0])===id){row=i+1;break;}
      if(row<0) throw new Error('找不到要編輯的商品');
    } else id='PG-'+Utilities.getUuid().slice(0,8).toUpperCase();
    var old=row>0?rows[row-1]:[];
    var imageUrl=Object.prototype.hasOwnProperty.call(d,'imageUrl')?String(d.imageUrl||''):String(old[9]||'');
    var record=[id,title,String(d.subtitle||'').trim(),category,String(d.categoryName||'手作選物'),price,Number(d.originalPrice)||price,String(d.description||'').trim(),old[8]||'active',imageUrl,d.inStock===false?false:true,row>0?old[11]:now,now];
    if(row>0) sh.getRange(row,1,1,record.length).setValues([record]); else sh.appendRow(record);
    var obj={}; PRODUCT_HEADERS.forEach(function(k,j){obj[k]=record[j];}); return publicProduct_(obj);
  } finally { lock.releaseLock(); }
}
function setStatus_(d) {
  var id=String(d.id||''), sh=productSheet_(), v=sh.getDataRange().getValues();
  for(var i=1;i<v.length;i++) if(String(v[i][0])===id) {
    var status=d.status==='active'?'active':'inactive';
    sh.getRange(i+1,9).setValue(status); sh.getRange(i+1,13).setValue(new Date());
    return {id:id,status:status};
  }
  throw new Error('找不到商品');
}
function uploadImage_(d) {
  var folder=PropertiesService.getScriptProperties().getProperty('IMAGE_FOLDER_ID');
  if(!folder) throw new Error('請設定指令碼屬性 IMAGE_FOLDER_ID');
  var mime=String(d.mimeType||''), allowed=['image/jpeg','image/png','image/webp'];
  if(allowed.indexOf(mime)<0) throw new Error('圖片僅支援 JPG、PNG、WebP');
  var base64=String(d.base64||'');
  if(!base64 || base64.length>5500000) throw new Error('圖片不可超過 4 MB');
  var blob=Utilities.newBlob(Utilities.base64Decode(base64),mime,String(d.fileName||'product-image').replace(/[\\\\/:*?"<>|]/g,'_').slice(0,100));
  var file=DriveApp.getFolderById(folder).createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
  return {imageUrl:'https://drive.google.com/uc?export=view&id='+file.getId(),fileId:file.getId()};
}
function jsonResponse_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}