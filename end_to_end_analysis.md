# Báo Cáo Phân Tích Chuyên Sâu End-to-End
## Component: Market Simulation & Streaming và News & Scenario

Tài liệu này cung cấp một cái nhìn **vô cùng chi tiết và toàn diện** về quy trình Kỹ nghệ phần mềm (Software Engineering) đã được áp dụng để xây dựng 2 thành phần cốt lõi nhất của dự án SoictStock. Phân tích đi sâu vào toán học, kiến trúc, và **giải thích tường tận từng file code** đã được định nghĩa trong kiến trúc.

---

# PHẦN 1: MARKET SIMULATION & STREAMING (MÔ PHỎNG VÀ TRUYỀN PHÁT GIÁ)

## 1.1 Quy trình End-to-End: Từ Yêu cầu (SRS) $\rightarrow$ Thiết kế $\rightarrow$ Lập trình

**Bước 1: Từ Đặc tả yêu cầu phần mềm (SRS)**
*   **Mục tiêu (Purpose):** Hệ thống cần một môi trường giả lập giá cổ phiếu thật nhất có thể để người dùng thực hành, loại bỏ rủi ro tài chính nhưng vẫn giữ nguyên cảm giác "nhịp đập" của thị trường.
*   **Use Case cốt lõi:** **UC-04: View Market:** Người dùng đăng nhập $\rightarrow$ Mở bảng điều khiển $\rightarrow$ Thấy danh sách mã chứng khoán (Tickers) $\rightarrow$ Xem biểu đồ nến lịch sử $\rightarrow$ Nhìn thấy giá nhảy múa từng giây (Real-time update) mà không cần tải lại trang.
*   **Yêu cầu chức năng (FR-02):** `FR-MKT-1` (Duy trì list cổ phiếu ảo), `FR-MKT-2` (Tự động sinh nến lịch sử), `FR-MKT-3` (Truyền phát dữ liệu qua WebSocket).

**Bước 2: Thiết kế hệ thống (System Design)**
*   **Chiến lược lưu trữ dữ liệu:** Không lưu mọi mức giá tick 3-giây vào DB vì sẽ làm sập server. Chỉ lưu lại **nến 5-phút (5-minute bars)**. Collection `ticks` trong MongoDB chỉ chứa các document nến OHLCV. Giá trị nhấp nháy mỗi 3 giây được giữ **hoàn toàn trên RAM (In-memory)**.
*   **Kiến trúc Lớp BCE:**
    *   *Entity:* `Stock`, `Tick`.
    *   *Control:* `SimulationEngine` (lõi sinh giá), `PriceStream` (truyền phát qua WebSocket), `MarketStore` (Zustand hứng dữ liệu ở Client).
    *   *Boundary:* `SimulationPage`, `StockChart`, `Watchlist`, `TickerHeader`, `MarketLoadingOverlay`.

**Bước 3: Lập trình mã nguồn (Implementation)**
Dưới đây là phần giải thích chi tiết toàn bộ các file code tham gia vào luồng hoạt động này, chia theo Backend và Frontend.

---

## 1.2 Giải thích chi tiết các file Code - Phía Backend (Tạo giá và truyền phát)

### 1. `backend/services/simulationEngine.js`
Đây là "trái tim" của toàn bộ hệ thống, chứa động cơ toán học sinh giá. 
*   Nó tự động chạy ngầm trên Server, dùng vòng lặp thời gian (`setInterval` mỗi 3 giây) để liên tục cộng/trừ giá thông qua hàm `tick()`. 
*   **Thuật toán định giá:** Áp dụng phương trình **Merton Jump-Diffusion** kết hợp 4 lớp vật lý:
    1.  *Geometric Brownian Motion (GBM):* Lõi cơ bản tính `log-return` dựa trên `drift` và `volatility`.
    2.  *Merton Jumps:* Bơm các cú sốc ngẫu nhiên (phân phối Poisson).
    3.  *Quán tính (Momentum Follow-through):* Thuật toán nhớ hướng đi của giá. Nếu có cú sập > 2.5 lần độ lệch chuẩn, Engine sẽ bơm thêm hệ số `activeDrift` cùng chiều trong vài nhịp tiếp theo để giá "trôi" tiếp tạo trend.
    4.  *Hồi quy giá trị trung bình (Ornstein-Uhlenbeck Mean Reversion):* Một lực kéo hãm phanh lại nếu giá đi quá xa so với `basePrice`, đảm bảo đồ thị không trôi dạt vào vô tận.
*   **Thuật toán nặn bóng nến (Brownian Bridge):** Hàm `_barWicks()`. Thay vì random bóng nến (high/low) vô lý, Engine vẽ hàng chục bước random walk vi mô từ Open đến Close. Nếu nến Đóng > Mở (nến xanh), thuật toán thường ép ra bóng dưới dài tạo hình thái nến cực chuẩn.
*   Cứ hết 5 phút, file này sẽ gộp các giá trên RAM lại thành 1 cây nến và ghi (Insert) vào Database.

### 2. `backend/services/stockData.js`
Nơi lưu trữ cấu hình tĩnh (Static config). File này định nghĩa mảng danh sách 30 mã cổ phiếu ảo ban đầu (ví dụ SCT, HEAL). Nó chứa các thông số vật lý gốc cho từng mã: mã (ticker), tên công ty, lĩnh vực, giá cơ sở (basePrice), độ lệch chuẩn (volatility) và xu hướng (drift). `simulationEngine.js` sẽ đọc file này để khởi tạo thị trường.

### 3. `backend/websocket/priceStream.js`
Trạm thu phát sóng. Khởi tạo Server WebSocket. File này lắng nghe sự kiện `engine.onTick()` từ `simulationEngine.js`. Khi có mức giá mới nhất được tính ra, nó sẽ sử dụng hàm `client.send()` để liên tục "bắn" (broadcast) một cục dữ liệu JSON chứa giá mới về phía các trình duyệt Client đang mở web.

### 4. `backend/routes/market.js`
Cung cấp các API REST (Ví dụ `GET /api/market/history`). Trong khi `priceStream.js` lo dữ liệu nhấp nháy hiện tại, thì file route này giúp Frontend gọi lên xin dữ liệu các cây nến lịch sử trong 30 ngày quá khứ để vẽ ra cái nền tảng biểu đồ ban đầu khi user mới tải trang.

> [!NOTE] 
> **Kết luận Backend Market Simulation:** 
> Backend đóng vai trò là "Nhà cái" (Market Maker). Nó thiết lập các định luật vật lý siêu thực cho cổ phiếu (thông qua `simulationEngine.js`), lưu trữ lịch sử (`market.js`), và đóng vai trò phát thanh viên thời gian thực (`priceStream.js`).

---

## 1.3 Giải thích chi tiết các file Code - Phía Frontend (Nhận giá và vẽ biểu đồ)

### 1. `frontend/src/store/marketStore.js`
Kho chứa State (quản lý bằng Zustand). 
*   Nó làm nhiệm vụ kết nối tới WebSocket của Backend. 
*   Khi nhận luồng giá real-time từ Server, nó lưu trữ lại vào biến `rawTicks`, chạy logic **nặn nến** (gộp các tick thành OHLCV) và kích hoạt re-render để báo cho các file giao diện biết cập nhật màn hình.
*   Nó có cơ chế **Fallback**: Nếu mất mạng, Store tự động dùng `Math.random` nội suy để giá vẫn nhảy cục bộ trên UI.

### 2. `frontend/src/pages/Simulation.jsx`
Màn hình chính của phòng giao dịch. Đây là khung (layout) tổng bọc toàn bộ các tính năng biểu đồ, bảng giá, đặt lệnh. File này đóng vai trò Container kết nối các Component con lại với nhau.

### 3. `frontend/src/components/simulation/StockChart.jsx`
File code đảm nhiệm việc vẽ biểu đồ Nến Nhật. Nhận mảng dữ liệu nến lịch sử và nến real-time từ `marketStore.js`, sử dụng thư viện (như Lightweight Charts) để ánh xạ mảng dữ liệu OHLCV thành biểu đồ trực quan có thể tương tác (zoom, pan).

### 4. `frontend/src/components/simulation/Watchlist.jsx`
Bảng danh sách các mã cổ phiếu ở bên trái màn hình. Nó lắng nghe biến động giá từ `marketStore.js` để cập nhật các đường mini-chart (sparklines) và chớp xanh/đỏ mỗi khi có giá mới của toàn bộ thị trường.

### 5. `frontend/src/components/simulation/TickerHeader.jsx`
Header nằm ngay trên biểu đồ. Chỉ hiển thị dòng chữ to: Giá hiện tại và tỷ lệ % tăng/giảm trong ngày của mã cổ phiếu đang xem, có hiệu ứng đổi màu Flash xanh/đỏ khi giá tick.

### 6. `frontend/src/components/simulation/MarketLoadingOverlay.jsx`
Giao diện Loading "Building Market History" hiện lên khi chờ Backend sinh giá. Lúc mới khởi động (First Run), Backend cần tính toán 1 năm nến lịch sử nên sẽ mất vài giây. File này hiển thị vòng xoay quay quay che màn hình để báo cáo tiến độ, tránh user nhìn thấy biểu đồ trống trơn.

> [!NOTE] 
> **Kết luận Frontend Market Simulation:** 
> Frontend đóng vai trò là "Thiết bị đầu cuối" (Trading Terminal). Nó thuần tuý thụ động lắng nghe dữ liệu từ Backend (`marketStore`), xử lý logic đồ hoạ mượt mà (`StockChart`) và cung cấp trải nghiệm UX trực quan (`Watchlist`, `TickerHeader`, `MarketLoadingOverlay`).

---

# PHẦN 2: NEWS & SCENARIO (TIN TỨC & KỊCH BẢN THỊ TRƯỜNG)

## 2.1 Quy trình End-to-End: Từ Yêu cầu (SRS) $\rightarrow$ Thiết kế $\rightarrow$ Lập trình

**Bước 1: Từ Đặc tả yêu cầu phần mềm (SRS)**
*   **Mục tiêu:** Hệ thống cần dạy người học cách thị trường phản ứng với tin tức vĩ mô thay vì chỉ giao dịch mù quáng. Cần tạo ra các sự kiện kinh tế hoặc kịch bản vĩ mô tác động làm giá cổ phiếu nhảy vọt hoặc sập mạnh.
*   **Use Case cốt lõi:** **UC-12: Manage market scenario** (kích hoạt kịch bản). Yêu cầu FR-MKT-5 (Hỗ trợ Market scenarios and regimes).

**Bước 2: Thiết kế hệ thống (System Design)**
*   **Dữ liệu:** Collection `news` lưu bản tin kèm `sentiment` (tích cực/tiêu cực), `impact` (độ sốc) và `affectedTickers`.
*   **Luồng hoạt động:** Thiết kế theo mô hình **Sự kiện Tác động**. Cần một tiến trình chạy ngầm (Background Job) định kỳ thu thập tin tức, sau đó tiêm (inject) tin tức này vào Engine sinh giá để tạo ra cú shock.

**Bước 3: Lập trình mã nguồn (Implementation)**
Dưới đây là phần giải thích chi tiết toàn bộ các file code tham gia vào luồng hoạt động này.

---

## 2.2 Giải thích chi tiết các file Code - Phía Backend (Tạo tin tức và áp dụng độ giật giá)

### 1. `backend/services/newsService.js`
Dịch vụ quản lý kho tin tức. Chứa logic sinh ra các bản tin (News) ngẫu nhiên (nếu không có API Key) hoặc cào từ API bên thứ 3 (GNews, Marketaux). Quản lý danh sách tin tức đang diễn ra. Nó phân tích tiêu đề (Headline) để tìm xem Ticker nào xuất hiện để xếp vào mảng `affectedTickers`.

### 2. `backend/services/newsInjector.js`
"Kẻ thao túng thị trường". File này đóng vai trò như một "Chiếc bơm". Nó liên tục canh thời gian (setInterval), khi có tin tức mới xuất hiện, nó lấy tin từ `newsService.js`, phân tích xem tin này là Tốt hay Xấu. Sau đó nó sẽ gọi hàm `applyShock()` được public từ bên trong `simulationEngine.js` để giật giá cổ phiếu (pump hoặc dump) tương ứng với độ tốt/xấu của bản tin.
*Đặc biệt: Hàm applyShock không chỉ ép giá xuống, mà đẩy biến `volCluster` (Cụm độ biến động GARCH) lên cực cao, làm thân nến sau tin tức dao động dữ dội mô phỏng sự hoảng loạn của đám đông.*

### 3. `backend/routes/news.js`
Các API (REST) đơn giản để Frontend lấy danh sách tin tức hiển thị lên bảng tin (Ví dụ `GET /api/news`).

### 4. `backend/routes/scenarios.js`
API nhận lệnh điều khiển kịch bản từ Admin. (Ví dụ: Chuyển toàn thị trường sang kịch bản Bull Market, Bear Market, hoặc Lạm phát). Khi kích hoạt, API này gọi hàm `setRegime()` trong `simulationEngine.js` để ghi đè hệ số `drift` (tăng trưởng) của nhóm ngành lên cực cao/thấp, làm giá cả nhóm ngành thay đổi xu hướng trong nhiều ngày liên tiếp.

> [!NOTE] 
> **Kết luận Backend News & Scenario:** 
> Đây là "Động cơ sự kiện" (Event Engine) của hệ thống. Nhờ việc cô lập lõi toán học ở `simulationEngine.js`, cụm `newsInjector.js` và `scenarios.js` có thể dễ dàng "kết nối" (hook) vào Engine để bóp méo thông số đầu vào ở thời gian thực theo logic kinh tế (tin tốt lên, tin xấu xuống), đem lại giá trị giáo dục.

---

## 2.3 Giải thích chi tiết các file Code - Phía Frontend (Hiển thị tin tức và điều khiển kịch bản)

### 1. `frontend/src/store/newsStore.js`
Kho trạng thái (Zustand) lưu trữ mảng danh sách các bài báo hiện tại đang có trên thị trường ở phía client. Nó liên tục cập nhật/chèn tin mới lên đầu khi có tin bài mới từ Backend gửi về.

### 2. `frontend/src/components/simulation/NewsPanel.jsx`
Khung cửa sổ hiển thị danh sách các tin tức (thường nằm ở bên dưới hoặc bên phải màn hình Simulation). Đây là một Scrolling feed. Khi có tin mới từ `newsStore.js`, danh sách này sẽ tự động cuộn (scroll) và chớp sáng màu đỏ/xanh lá để cảnh báo người chơi rằng thị trường đang có biến.

### 3. `frontend/src/components/shared/NewsModal.jsx`
Khi user bấm vào một mẩu tin trong `NewsPanel`, Modal này sẽ bật lên để hiển thị chi tiết toàn văn bài viết báo chí ảo, giúp người dùng đọc và hiểu lý do vì sao giá lại sập trên biểu đồ.

### 4. `frontend/src/components/simulation/ScenarioSelector.jsx`
File giao diện chứa các nút bấm (dạng Dropdown, dành cho Admin hoặc chế độ luyện tập đặc biệt) để chủ động chọn và kích hoạt một kịch bản thị trường cụ thể. Khi bấm, nó sẽ gọi API lên `backend/routes/scenarios.js` để tác động hệ thống.

> [!NOTE] 
> **Kết luận Frontend News & Scenario:** 
> Frontend ở phần này đóng vai trò "Bảng thông tin bối cảnh" (Context UI). Bằng cách kết hợp giữa sự kiện nhấp nháy trên `NewsPanel.jsx` và sự sụp đổ của biểu đồ `StockChart.jsx`, Frontend tạo ra cầu nối nhận thức trực quan cho người học, diễn giải cho người dùng hiểu: "Tại sao biểu đồ lại sập?".
