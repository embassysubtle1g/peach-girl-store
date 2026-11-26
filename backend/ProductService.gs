/**
 * 商品查詢與管理
 */
function publicProduct_(product) {
  return {
    id: String(product.product_id),
    title: String(product.title || ''),
    subtitle: String(product.subtitle || ''),
    category: String(product.category || 'finished'),
    categoryName: String(product.category_name || '手作選物'),
    price: Number(product.price) || 0,
    originalPrice: Number(product.original_price) || Number(product.price) || 0,
    description: String(product.description || ''),
    imageUrl: String(product.image_url || ''),
    inStock: String(product.in_stock).toLowerCase() !== 'false',
    status: String(product.status || 'active'),
    badge: '',
    rating: 5,
    reviewCount: 0,
    soldCount: 0,
    freeShippingEligible: true,
    variants: [],
    reviews: []
  };
}

function saveProduct_(data) {
  var title = String(data.title || '').trim();
  var category = String(data.category || '').trim();
  var price = Number(data.price);

  if (!title) throw new Error('請輸入商品名稱');
  if (!category) throw new Error('請選擇商品分類');
  if (!Number.isFinite(price) || price < 0) throw new Error('商品價格不正確');

  var sheet = productSheet_();
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var rows = sheet.getDataRange().getValues();
    var id = String(data.id || '');
    var rowNumber = -1;
    var now = new Date();

    if (id) {
      for (var i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === id) {
          rowNumber = i + 1;
          break;
        }
      }
      if (rowNumber < 0) throw new Error('找不到要編輯的商品');
    } else {
      id = 'PG-' + Utilities.getUuid().slice(0, 8).toUpperCase();
    }

    var old = rowNumber > 0 ? rows[rowNumber - 1] : [];
    var imageUrl = Object.prototype.hasOwnProperty.call(data, 'imageUrl')
      ? String(data.imageUrl || '')
      : String(old[9] || '');

    var record = [
      id, title, String(data.subtitle || '').trim(), category,
      String(data.categoryName || '手作選物'), price,
      Number(data.originalPrice) || price, String(data.description || '').trim(),
      old[8] || 'active', imageUrl, data.inStock === false ? false : true,
      rowNumber > 0 ? old[11] : now, now
    ];

    if (rowNumber > 0) {
      sheet.getRange(rowNumber, 1, 1, record.length).setValues([record]);
    } else {
      sheet.appendRow(record);
    }

    var product = {};
    PRODUCT_HEADERS.forEach(function(key, index) {
      product[key] = record[index];
    });
    return publicProduct_(product);
  } finally {
    lock.releaseLock();
  }
}

function setStatus_(data) {
  var id = String(data.id || '');
  var sheet = productSheet_();
  var rows = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) !== id) continue;

    var status = data.status === 'active' ? 'active' : 'inactive';
    sheet.getRange(i + 1, 9).setValue(status);
    sheet.getRange(i + 1, 13).setValue(new Date());
    return { id: id, status: status };
  }
  throw new Error('找不到商品');
}
