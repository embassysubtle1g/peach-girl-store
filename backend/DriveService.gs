/**
 * Google Drive 商品圖片上傳
 */
function uploadImage_(data) {
  var folderId = PropertiesService.getScriptProperties().getProperty('IMAGE_FOLDER_ID');
  if (!folderId) throw new Error('請設定指令碼屬性 IMAGE_FOLDER_ID');

  var mimeType = String(data.mimeType || '');
  var allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.indexOf(mimeType) < 0) {
    throw new Error('圖片僅支援 JPG、PNG、WebP');
  }

  var base64 = String(data.base64 || '');
  if (!base64 || base64.length > 5500000) throw new Error('圖片不可超過 4 MB');

  var fileName = String(data.fileName || 'product-image')
    .replace(/[\\/:*?"<>|]/g, '_')
    .slice(0, 100);
  var blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType, fileName);
  var file = DriveApp.getFolderById(folderId).createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return {
    imageUrl: 'https://drive.google.com/uc?export=view&id=' + file.getId(),
    fileId: file.getId()
  };
}
