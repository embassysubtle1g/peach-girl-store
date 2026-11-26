/**
 * 管理員登入與權限
 * 初次設定時，先修改 setInitialAdmin() 的帳號密碼，執行一次後移除明文密碼。
 */
function setInitialAdmin() {
  configureAdmin_('CHANGE_USERNAME', 'CHANGE_TO_A_LONG_RANDOM_PASSWORD');
}

function configureAdmin_(username, password) {
  if (!username || !password || username.indexOf('CHANGE_') === 0 || password.indexOf('CHANGE_') === 0) {
    throw new Error('請先修改 setInitialAdmin() 的帳號密碼');
  }
  if (password.length < 12) throw new Error('密碼至少需要 12 個字元');

  var salt = Utilities.getUuid();
  PropertiesService.getScriptProperties().setProperties({
    ADMIN_USERNAME: username,
    ADMIN_SALT: salt,
    ADMIN_PASSWORD_HASH: passwordHash_(password, salt)
  });
  Logger.log('管理員帳密設定完成，請移除 setInitialAdmin() 內的明文密碼。');
}

function login_(data) {
  var properties = PropertiesService.getScriptProperties();
  var username = properties.getProperty('ADMIN_USERNAME');
  var salt = properties.getProperty('ADMIN_SALT');
  var savedHash = properties.getProperty('ADMIN_PASSWORD_HASH');

  if (!username || !salt || !savedHash) throw new Error('管理員尚未完成初始設定');

  if (String(data.username || '') !== username ||
      passwordHash_(String(data.password || ''), salt) !== savedHash) {
    Utilities.sleep(500);
    throw new Error('帳號或密碼錯誤');
  }

  var token = Utilities.getUuid() + Utilities.getUuid();
  CacheService.getScriptCache().put('admin_' + hash_(token), '1', 21600);
  return { token: token, expiresIn: 21600 };
}

function requireAdmin_(token) {
  if (!token || CacheService.getScriptCache().get('admin_' + hash_(token)) !== '1') {
    throw new Error('登入已逾時，請重新登入');
  }
}

function adminLogout_(token) {
  if (token) CacheService.getScriptCache().remove('admin_' + hash_(token));
  return { loggedOut: true };
}
