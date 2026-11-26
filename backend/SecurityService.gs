/**
 * 密碼與 Token 雜湊工具
 */
function passwordHash_(password, salt) {
  var value = salt + ':' + password;
  for (var i = 0; i < 10000; i++) {
    value = Utilities.base64Encode(
      Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8)
    );
  }
  return value;
}

function hash_(value) {
  return Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8)
  ).replace(/=+$/g, '');
}
