/**
 * API 動作分派。Bridge 與 HTTP POST 共用同一份路由，避免兩邊行為不一致。
 */
function dispatchApi_(request) {
  var req = request || {};
  var data = req.data || {};

  switch (req.action) {
    case 'getProducts':
      return readProducts_()
        .filter(function(product) { return product.status === 'active'; })
        .map(publicProduct_);

    case 'adminLogin':
      return login_(data);

    case 'adminLogout':
      return adminLogout_(req.token);

    case 'memberRegister':
      return registerMember_(data);

    case 'memberLogin':
      return loginMember_(data);

    case 'memberGet':
      return getMemberFromToken_(req.token);

    case 'memberGetCommerce':
      return getMemberCommerce_(req.token);

    case 'memberSaveCommerce':
      return saveMemberCommerce_(req.token, data);

    case 'memberLogout':
      return logoutMember_(req.token);

    case 'adminListProducts':
      requireAdmin_(req.token);
      return readProducts_().map(publicProduct_);

    case 'saveProduct':
      requireAdmin_(req.token);
      return saveProduct_(data);

    case 'setProductStatus':
      requireAdmin_(req.token);
      return setStatus_(data);

    case 'uploadProductImage':
      requireAdmin_(req.token);
      return uploadImage_(data);

    default:
      throw new Error('不支援的 API：' + req.action);
  }
}
