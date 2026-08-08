# AGENTS.md

給後續 AI / Codex 維護這個專案用。先讀現有程式，再做最小可行修改。

## 回覆與實作原則

- 預設使用 `ponytail full`：少做、做對、不要為未來需求加抽象。
- 優先沿用專案既有寫法：Vue SFC、Pinia store、`src/data/*` helper、既有 CSS class 與 common components。
- 不輕易新增依賴；先確認 Vue、browser API、既有套件是否已足夠。
- 避免無關重構、格式化整批檔案、改命名風格或搬移檔案。
- 修改資料格式時，同步更新 type、normalize、validate、serialize/import UI。
- 回覆保持直接、短、有結論；需要取捨時說明採用的最小方案。

## 專案概況

這是 Vue 3 + Vite + TypeScript 的攤位地圖 / 逛攤清單工具。

主要路由：

- `/`：`Map` 頁，顯示場次地圖。
- `/listEditor`：逛攤清單資料編輯頁。

主要套件：

- `vue` / `vue-router`
- `pinia`
- `vue-draggable-plus`
- `tailwindcss`

## 目前功能

- `Map` 頁使用 HTML/CSS 顯示攤位地圖，攤位以絕對定位的 button 渲染。
- 攤位可依狀態顯示一般、可點選、已選取樣式。
- 點選有對應清單項目的攤位會切換目前清單項目。
- 切換清單項目時，地圖會自動置中到對應攤位。
- 地圖透過 CSS transform 位移與縮放，支援拖曳、滑鼠滾輪縮放、雙指縮放。
- 低縮放倍率時，連續且不可點選的攤位會合併顯示成範圍標籤，降低畫面複雜度。
- 地圖底部有清單項目列，支援左右按鈕、觸控滑動、點選 dot 切換。
- 底部清單項目列顯示攤位、作者、標籤、認親禮數量、註解狀態與購買總額。
- bottom sheet 可展開；目前展開詳情仍是「詳細內容稍後討論」，不要描述成已完成詳情頁。
- `逛攤清單` 頁可新增、刪除、展開、編輯清單項目，並支援拖曳排序。
- 清單項目內容包含攤位、啟用狀態、作者、購買項目、認親禮、標籤、樣式、註解、排序優先度。
- 清單項目資料、地圖 layout、攤位資料皆支援 JSON 匯入 / 匯出。
- JSON modal 可載入 `public/example-data/*` 內的範例資料。
- 清單項目、地圖設定、目前選取索引使用 `localStorage` 保存。

## 資料與修改重點

- 清單項目型別看 `src/types/listItem.ts`。
- 清單項目預設資料看 `src/data/listItemData.ts`。
- 清單項目正規化與儲存主要在 `src/stores/listStore.ts`。
- 清單項目 JSON 匯入 / 匯出在 `src/components/ListDataManagerModal.vue`。
- 標籤設定在 `src/data/listItemTags.ts`。
- 清單項目樣式設定在 `src/data/listItemStyles.ts`。
- 地圖型別看 `src/types/map.ts`。
- 地圖預設資料、layout/booth 正規化、驗證、range 展開與序列化在 `src/data/mapData.ts`。
- 地圖 layout JSON 管理在 `src/components/MapLayoutManagerModal.vue`。
- 場次攤位 JSON 管理在 `src/components/EventBoothManagerModal.vue`。
- 場次索引在 `public/data/map-index.json`，場次資料在 `public/data/events/*`。

## 開發命令

- `npm run dev`：啟動開發伺服器。
- `npm run build`：建置正式版。
- `npm run preview`：預覽建置結果。

只修改文件時不用跑 build。修改 Vue / TS / CSS 行為時，至少確認相關檔案與資料流；需要驗證再跑 `npm run build`。
