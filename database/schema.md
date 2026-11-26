# Peach Girl Store 資料庫規格（草案）

Google 試算表作為初期資料庫，每個章節對應一個工作表。

- Products：商品主檔（product_id、name、category_id、price、description、status）
- Categories：商品分類（category_id、name、sort_order、status）
- ProductImages：商品圖片（image_id、product_id、image_url、sort_order）
- ProductVariants：商品規格（variant_id、product_id、name、option、price_delta）
- Inventory：庫存（inventory_id、variant_id、quantity、updated_at）
- Members：會員（member_id、google_sub、display_name、email、created_at）
- Orders：訂單主檔（order_id、member_id、status、subtotal、shipping_fee、total、created_at）
- OrderItems：訂單明細（order_item_id、order_id、product_id、product_name_snapshot、variant_snapshot、unit_price_snapshot、quantity）
- Favorites：收藏（member_id、product_id、created_at）

注意：會員驗證、訂單寫入、庫存扣除都必須在後端完成；不得信任前端傳入的價格或付款成功狀態。
