/**
 * 會員服務：電子郵件 + 密碼註冊、登入、查詢與登出
 */
function registerMember_(data) {
  var email = String(data.email || '').trim().toLowerCase();
  var password = String(data.password || '');
  var displayName = String(data.displayName || '').trim();
  var phone = String(data.phone || '').trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('請輸入有效的電子郵件地址');
  }
  if (password.length < 12) throw new Error('密碼至少需要 12 個字元');
  if (displayName.length < 1 || displayName.length > 40) throw new Error('稱呼請輸入 1 至 40 個字元');
  if (phone.length > 30) throw new Error('電話格式不正確');

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = memberSheet_('Members');
    var rows = sheet.getDataRange().getValues();

    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][2] || '').trim().toLowerCase() === email) {
        throw new Error('這個電子郵件已經註冊，請直接登入');
      }
    }

    var now = new Date();
    var memberId = 'MB-' + Utilities.getUuid().slice(0, 8).toUpperCase();
    var salt = Utilities.getUuid();

    // Members 欄位順序：member_id, username, email, password_hash, password_salt, ...
    sheet.appendRow([
      memberId, email, email, passwordHash_(password, salt), salt,
      displayName, phone, 'active', now, now, ''
    ]);

    return createMemberSession_(memberId);
  } finally {
    lock.releaseLock();
  }
}

function loginMember_(data) {
  var email = String(data.email || '').trim().toLowerCase();
  var password = String(data.password || '');
  if (!email || !password) throw new Error('請輸入電子郵件與密碼');

  var sheet = memberSheet_('Members');
  var rows = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][2] || '').trim().toLowerCase() !== email) continue;
    if (String(rows[i][7] || '') !== 'active') throw new Error('此會員帳號目前無法使用');

    if (passwordHash_(password, String(rows[i][4] || '')) !== String(rows[i][3] || '')) {
      Utilities.sleep(400);
      throw new Error('電子郵件或密碼錯誤');
    }

    sheet.getRange(i + 1, 10).setValue(new Date());
    return createMemberSession_(String(rows[i][0]));
  }

  Utilities.sleep(400);
  throw new Error('電子郵件或密碼錯誤');
}

function memberPublic_(row) {
  return {
    id: String(row[0]),
    email: String(row[2] || ''),
    displayName: String(row[5] || ''),
    phone: String(row[6] || '')
  };
}

function createMemberSession_(memberId) {
  var token = Utilities.getUuid() + Utilities.getUuid();
  var now = new Date();
  var expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  memberSheet_('MemberSessions').appendRow([
    Utilities.getUuid(), memberId, hash_(token), expiresAt, now
  ]);

  var rows = memberSheet_('Members').getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === memberId) {
      return {
        token: token,
        expiresAt: expiresAt.toISOString(),
        member: memberPublic_(rows[i])
      };
    }
  }
  throw new Error('會員資料不存在');
}

function getMemberFromToken_(token) {
  if (!token) throw new Error('請先登入會員');

  var digest = hash_(String(token));
  var sessions = memberSheet_('MemberSessions');
  var rows = sessions.getDataRange().getValues();
  var now = new Date();
  var memberId = '';

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][2]) !== digest) continue;

    if (new Date(rows[i][3]).getTime() <= now.getTime()) {
      sessions.deleteRow(i + 1);
      throw new Error('登入已逾期，請重新登入');
    }
    memberId = String(rows[i][1]);
    break;
  }

  if (!memberId) throw new Error('登入已逾期，請重新登入');

  var members = memberSheet_('Members').getDataRange().getValues();
  for (var j = 1; j < members.length; j++) {
    if (String(members[j][0]) === memberId && String(members[j][7]) === 'active') {
      return memberPublic_(members[j]);
    }
  }
  throw new Error('會員帳號目前無法使用');
}

function logoutMember_(token) {
  if (!token) return { loggedOut: true };

  var digest = hash_(String(token));
  var sheet = memberSheet_('MemberSessions');
  var rows = sheet.getDataRange().getValues();

  for (var i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][2]) === digest) sheet.deleteRow(i + 1);
  }
  return { loggedOut: true };
}
