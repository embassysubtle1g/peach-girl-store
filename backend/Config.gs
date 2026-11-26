/**
 * Peach Girl Store - 共用設定
 * Apps Script 專案中的 .gs 檔案共用全域命名空間，不需要 import/export。
 */
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
  Cart: ['cart_item_id','member_id','product_id','variant_text','quantity','created_at','updated_at'],
  Payments: ['payment_id','order_id','payment_method','payment_status','amount','transaction_id','paid_at','created_at','updated_at'],
  Shipments: ['shipment_id','order_id','carrier','tracking_number','shipping_status','shipped_at','delivered_at','created_at','updated_at'],
  Admins: ['admin_id','username','display_name','role','status','created_at','updated_at','last_login_at'],
  MemberSessions: ['session_id','member_id','token_hash','expires_at','created_at']
};
