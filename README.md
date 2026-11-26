# 蜜桃女孩手作工作室｜Peach Girl Store

React + Vite 前端、Google Apps Script 後端、Google 試算表資料庫。

## 專案結構
- `frontend/`：React 購物網站
- `backend/`：Apps Script API
- `database/`：資料表規格
- `docs/`：架構與開發文件
- `legacy/index-original.html`：原始單檔網站備份

## 本機開發
```bash
cd frontend
npm install
npm run dev
```

## 建置
```bash
npm run build
```

目前為 React 架構試驗版。原版商品資料已搬入；購物車完整流程、收藏、會員、結帳及 GAS 真實資料串接尚待分階段移植。


## 商品管理（第一階段）

- 管理入口：`https://embassysubtle1g.github.io/peach-girl-store/?admin=1`
- 管理員使用自訂帳號密碼，不使用 Google 帳號登入。
- 後端資料儲存仍採 Google Apps Script + Google Sheets；商品圖片存放在 Google Drive 資料夾。

### 初次設定
1. 建立 Google 試算表，複製試算表 ID；建立 Google Drive 圖片資料夾，複製資料夾 ID。
2. 開啟 Apps Script，貼上 `backend/Code.gs`。
3. 在 Apps Script「專案設定 → 指令碼屬性」新增 `SPREADSHEET_ID`、`IMAGE_FOLDER_ID`。
4. 執行 `initializeStore()` 建立 Products 工作表。
5. 修改 `setInitialAdmin()` 中的帳號密碼（至少 12 字元），執行一次後立即刪除或註解明文密碼。
6. 部署 Apps Script 網頁應用程式：執行身分選「我」、存取權選「所有人」，複製部署網址。
7. 在 GitHub Repository Settings → Secrets and variables → Actions 新增 Repository secret `VITE_API_BASE_URL`，值為 Apps Script 部署網址，然後重新執行 Pages 部署。

注意：商品圖片會使用「知道連結的任何人可檢視」，才能讓未登入訪客看見。只上傳可公開展示的商品照片。
