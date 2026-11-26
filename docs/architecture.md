# 系統架構

- frontend：React + Vite，部署至 GitHub Pages。
- backend：Google Apps Script Web App，提供 JSON API。
- database：Google 試算表，初期資料儲存。
- legacy/index-original.html：原始單檔網站備份，僅供功能與設計對照。

前端 API 網址透過 GitHub Actions repository secret / build variable 注入，不將私密憑證寫入前端。GitHub Pages 是公開前端，任何打包進去的值都可被訪客讀取。
