/**
 * 會員購物車與收藏同步服務
 * 前端傳入完整狀態；後端以會員 ID 隔離資料，避免跨帳號讀寫。
 */
function getMemberCommerce_(token) {
  var member = getMemberFromToken_(token);
  var memberId = member.id;
  var favorites = getStoreSheet_('Favorites').getDataRange().getValues();
  var cart = getStoreSheet_('Cart').getDataRange().getValues();

  return {
    wishlist: favorites.slice(1)
      .filter(function(row) { return String(row[1]) === memberId; })
      .map(function(row) { return String(row[2]); }),
    cart: cart.slice(1)
      .filter(function(row) { return String(row[1]) === memberId; })
      .map(function(row) {
        return {
          productId: String(row[2]),
          variantText: String(row[3] || ''),
          quantity: Math.max(1, Number(row[4]) || 1)
        };
      })
  };
}

function saveMemberCommerce_(token, data) {
  var member = getMemberFromToken_(token);
  var memberId = member.id;
  var payload = data || {};
  var wishlist = Array.isArray(payload.wishlist) ? payload.wishlist : [];
  var cart = Array.isArray(payload.cart) ? payload.cart : [];
  var products = readProducts_();
  var activeIds = {};
  products.forEach(function(product) {
    if (product.status === 'active') activeIds[String(product.product_id)] = true;
  });

  var uniqueFavorites = {};
  wishlist.forEach(function(id) {
    var productId = String(id || '').trim();
    if (productId && activeIds[productId]) uniqueFavorites[productId] = true;
  });

  var uniqueCart = {};
  cart.forEach(function(item) {
    if (!item) return;
    var productId = String(item.productId || '').trim();
    var variantText = String(item.variantText || '').slice(0, 500);
    var quantity = Math.floor(Number(item.quantity));
    if (!productId || !activeIds[productId] || !Number.isFinite(quantity) || quantity < 1) return;
    quantity = Math.min(quantity, 99);
    var key = productId + '::' + variantText;
    if (!uniqueCart[key]) uniqueCart[key] = { productId: productId, variantText: variantText, quantity: 0 };
    uniqueCart[key].quantity = Math.min(99, uniqueCart[key].quantity + quantity);
  });

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var favoriteSheet = getStoreSheet_('Favorites');
    var favoriteRows = favoriteSheet.getDataRange().getValues();
    for (var i = favoriteRows.length - 1; i >= 1; i--) {
      if (String(favoriteRows[i][1]) === memberId) favoriteSheet.deleteRow(i + 1);
    }
    var now = new Date();
    Object.keys(uniqueFavorites).forEach(function(productId) {
      favoriteSheet.appendRow([Utilities.getUuid(), memberId, productId, now]);
    });

    var cartSheet = getStoreSheet_('Cart');
    var cartRows = cartSheet.getDataRange().getValues();
    for (var j = cartRows.length - 1; j >= 1; j--) {
      if (String(cartRows[j][1]) === memberId) cartSheet.deleteRow(j + 1);
    }
    Object.keys(uniqueCart).forEach(function(key) {
      var item = uniqueCart[key];
      cartSheet.appendRow([
        Utilities.getUuid(), memberId, item.productId, item.variantText,
        item.quantity, now, now
      ]);
    });
  } finally {
    lock.releaseLock();
  }

  return { saved: true };
}
