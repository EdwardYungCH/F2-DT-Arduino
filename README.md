# F2-DT-Arduino

中二設計與科技：Arduino UNO 單元，共五堂。每堂是一個獨立的 HTML 檔，毋須安裝，用 Chrome 或 Edge 開啟即可。

| 堂 | 項目 | 學生網址（開啟 GitHub Pages 後） |
|---|---|---|
| 1 | Arduino 初體驗：閃動 L 燈（含延伸挑戰：心跳燈、修好壞掉的程式） | https://edwardyungch.github.io/f2-dt-arduino/lesson1/ |
| 2 | SOS 求救燈（含延伸挑戰：聲光 SOS、英文縮寫） | https://edwardyungch.github.io/f2-dt-arduino/lesson2/ |
| 3 | 行人過路燈（含延伸挑戰：過路嘀嘀聲、單車防盜警報） | https://edwardyungch.github.io/f2-dt-arduino/lesson3/ |
| 4 | 自動夜燈（含延伸挑戰：電位器調校靈敏度、越暗越亮） | https://edwardyungch.github.io/f2-dt-arduino/lesson4/ |
| 5 | 智能停車場閘門（含延伸挑戰：管理員按鈕、慢慢開閘） | https://edwardyungch.github.io/f2-dt-arduino/lesson5/ |

首頁 `index.html` 列出所有項目，供老師使用。上課時只把當堂的網址給學生；項目頁內沒有返回首頁的連結。

## 結構

```
index.html              首頁（項目清單在檔內 LESSONS 陣列）
lesson1/index.html      第 1 堂：Arduino 初體驗（由 src/lesson1-blink 建置）
lesson2/index.html      第 2 堂：SOS 求救燈（由 src/lesson2-sos 建置，不要直接修改）
lesson3/index.html      第 3 堂：行人過路燈（由 src/lesson3-traffic 建置）
lesson4/index.html      第 4 堂：自動夜燈（由 src/lesson4-nightlight 建置）
lesson5/index.html      第 5 堂：智能停車場閘門（由 src/lesson5-parking 建置）
src/lessonN-*/          各堂的原始碼及 build.py
src/shared/             各堂共用：套件材料清單、電阻辨認卡及小測（kit.js、kit.css）
tools/                  Playwright 自動測試（主任務流程、延伸挑戰、接線檢查、未完成報告）
```

修改後重新建置，例如：`python3 src/lesson3-traffic/build.py`

## 每堂的共通功能

- 學生登記（姓名、班別、學號），進度自動儲存
- 模擬器分階段解鎖，有引導、提示及錯誤檢查
- 成績報告：下載一個有驗證碼的 HTML 檔，內容被修改會顯示「驗證失敗」
- 「未完成？先交報告」：下課前未完成可先交一份報告（只計已完成的部分，標明「未完成」），之後可繼續做並再交完整報告；核對工具會標出每位學生最新的一份
- 材料清單、電阻辨認（套件的藍色五環電阻：220Ω 紅紅黑黑棕、10kΩ 棕黑黑紅棕）、導線顏色跟套件一樣（黑、白、紅、藍、綠）
- 教師模式（頁尾）：成績核對工具（一次拖入全班報告、匯出 CSV）、跳頁示範、清除進度
- 教師密碼及報告密鑰在各堂檔案開頭的 `CONFIG` 內修改
