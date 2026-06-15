# Báo Cáo Phân Tích Chuyên Sâu End-to-End
## Component: Market Simulation & Streaming và News & Scenario

Tài liệu này cung cấp một cái nhìn **vô cùng chi tiết và toàn diện** về quy trình Kỹ nghệ phần mềm (Software Engineering) đã được áp dụng để xây dựng 2 thành phần cốt lõi nhất của dự án SoictStock. Phân tích đi sâu vào toán học, kiến trúc, và từng dòng logic quan trọng trong mã nguồn, giúp bạn hoàn toàn làm chủ kiến thức để bảo vệ trước hội đồng.

---

# PHẦN 1: MARKET SIMULATION & STREAMING (MÔ PHỎNG VÀ TRUYỀN PHÁT GIÁ)

Đây là "trái tim" của toàn bộ hệ thống SoictStock, chịu trách nhiệm biến một trang web vô tri thành một sàn giao dịch ảo sống động.

## Bước 1: Từ Đặc tả yêu cầu phần mềm (SRS)

Mọi thứ bắt đầu từ việc định nghĩa bài toán trong tài liệu SRS (Chương 2):

1.  **Mục tiêu (Purpose):** Hệ thống cần một môi trường giả lập giá cổ phiếu thật nhất có thể để người dùng thực hành, loại bỏ rủi ro tài chính nhưng vẫn giữ nguyên cảm giác "nhịp đập" của thị trường.
2.  **Use Case cốt lõi:**
    *   **UC-04: View Market:** Người dùng đăng nhập $\rightarrow$ Mở bảng điều khiển $\rightarrow$ Thấy danh sách mã chứng khoán (Tickers) $\rightarrow$ Xem biểu đồ nến lịch sử $\rightarrow$ Nhìn thấy giá nhảy múa từng giây (Real-time update) mà không cần tải lại trang.
    *   **Alternative Flow của UC-04:** Nếu mất mạng (WebSocket đứt), giao diện phải tự động chuyển sang chế độ "mô phỏng cục bộ" (fallback) để đồ thị không bị đứng im, duy trì ảo giác liên tục cho người học.
3.  **Yêu cầu chức năng (Functional Requirements - FR-02):**
    *   `FR-MKT-1`: Duy trì danh sách cổ phiếu ảo (vd: SCT, HEAL).
    *   `FR-MKT-2`: Hệ thống phải **tự động sinh ra các thanh nến (bars)** lịch sử trong quá khứ.
    *   `FR-MKT-3`: Truyền phát (Stream) dữ liệu giá cập nhật theo thời gian thực qua giao thức **WebSocket**.

## Bước 2: Thiết kế hệ thống (System Design)

Để thoả mãn các yêu cầu khắt khe trên (đặc biệt là FR-MKT-2 và FR-MKT-3) mà không làm sập server do cạn kiệt tài nguyên, kiến trúc được thiết kế như sau (Dựa theo **Figure 3.2: BCE Analysis Diagram** và **Figure 4.6** trong báo cáo):

### 2.1 Chiến lược lưu trữ dữ liệu (Database Design)
Nếu một ngày có hàng triệu lượt thay đổi giá (tick) mà ghi tất cả vào Database thì MongoDB sẽ nhanh chóng sập. 
*   **Giải pháp:** Chỉ lưu lại **nến 5-phút (5-minute bars)**. Collection `ticks` trong MongoDB chỉ chứa các document có cấu trúc: `ticker`, `time` (mốc 5 phút), `open`, `high`, `low`, `price` (close), và `volume`.
*   Giá trị nhấp nháy mỗi 3 giây được giữ **hoàn toàn trên RAM (In-memory)** của Backend và ném thẳng qua WebSocket xuống Client. Cứ hết 300 giây (5 phút), Backend mới gộp các giá trên RAM lại thành 1 cây nến và ghi (Insert) vào DB 1 lần duy nhất.

### 2.2 Kiến trúc Lớp BCE (Boundary - Control - Entity)
*   **Entity (Thực thể):** `Stock` (Cổ phiếu ảo với các thông số vật lý như `drift`, `volatility`), `Tick` (Bản ghi nến 5-phút).
*   **Control (Điều khiển):** 
    *   `SimulationEngine`: Khối động cơ toán học. Tự động chạy ngầm trên Server, dùng vòng lặp thời gian để liên tục cộng/trừ giá.
    *   `PriceStream`: Trạm thu phát sóng WebSocket. Nhận giá từ Engine và phát cho Client.
    *   `MarketStore` (Phía Client): Kho hứng dữ liệu, nhào nặn lại mảng nến.
*   **Boundary (Giao diện):** `SimulationPage` (Trang chính), `StockChart` (Khung vẽ biểu đồ).

### 2.3 Luồng tuần tự (Sequence Diagram - Figure 3.7)
*   Khởi động: Khi backend chạy, nó kiểm tra DB. Nếu DB trống, nó chạy lệnh `_generateHistory()` lùi thời gian về 30 ngày trước, tính toán hàng chục ngàn cây nến 5-phút và Insert ồ ạt vào DB. Lỗ hổng này giải thích màn hình **"Building Market History"**.
*   Real-time: Server mở vòng lặp (setInterval) 3 giây một lần $\rightarrow$ `SimulationEngine` tính ra giá mới $\rightarrow$ Gọi hàm callback đẩy vào `PriceStream` $\rightarrow$ Phát qua WebSocket $\rightarrow$ Client nhận và vẽ lên Chart.

## Bước 3: Lập trình mã nguồn chi tiết (Implementation)

Đây là nơi lý thuyết biến thành các dòng code thực tế cực kỳ tinh vi:

### 3.1 Khối Backend
**File `backend/services/simulationEngine.js`**
Đây là một kiệt tác về mô phỏng tài chính. Thuật toán định giá không dùng hàm `Math.random()` đơn thuần, mà dùng phương trình **Merton Jump-Diffusion** kết hợp 4 lớp vật lý:
1.  **Geometric Brownian Motion (GBM):** Lõi cơ bản. Hàm `_mertonStep()` tính toán lợi suất logarit (log-return) dựa trên Xu hướng dài hạn (`drift`) và Độ nhiễu (`volatility`).
2.  **Merton Jumps (Cú sốc phân phối Poisson):** Mô phỏng việc thỉnh thoảng có tin giật gân làm giá sập hoặc tăng sốc. Tần suất xảy ra (lambda) tuân theo phân phối Poisson.
3.  **Quán tính (Momentum Follow-through):** Cực kỳ tinh tế. Thuật toán nhớ hướng đi của giá. Nếu có cú sập > 2.5 lần độ lệch chuẩn, Engine sẽ bơm thêm hệ số `activeDrift` cùng chiều trong vài nhịp tiếp theo để giá "trôi" tiếp (tạo thành một trend rớt giá tự nhiên) thay vì chỉ giật 1 nến rồi quay lại quỹ đạo cũ.
4.  **Hồi quy giá trị trung bình (Ornstein-Uhlenbeck Mean Reversion):** Nếu giá chạy quá xa so với `basePrice` gốc, một lực kéo `meanRevDrift = -MEAN_REV_SPEED * ln(price / basePrice)` sẽ hãm phanh lại. Giá càng đi xa, lực kéo về càng mạnh, đảm bảo đồ thị không trôi dạt vào vô tận.
5.  **Cầu Brownian (Brownian Bridge) nặn bóng nến:** Hàm `_barWicks()`. Thay vì random bóng nến (high/low) vô lý, Engine vẽ hàng chục bước random walk vi mô từ Open đến Close. Kết quả là nếu nến Đóng > Mở (nến xanh), thuật toán thường ép ra bóng dưới dài (do giá phải nhúng xuống tạo đáy rồi bật lên). Điều này tạo ra hình thái nến cực chuẩn theo lý thuyết nến Nhật!

**File `backend/websocket/priceStream.js`**
*   Lắng nghe sự kiện `engine.onTick((updates) => {...})`. 
*   Khi có giá mới, nó duyệt qua danh sách các thiết bị đang kết nối qua thư viện `ws` và gọi `client.send()` để đẩy Object chứa cục dữ liệu giá mới nhất.

### 3.2 Khối Frontend
**File `frontend/src/store/marketStore.js`**
*   Quản lý toàn bộ state thị trường bằng `Zustand`.
*   Khởi tạo `new WebSocket()`. Khi nhận message `tick`, nó chạy logic **nặn nến**. Nếu nhịp tick này vẫn nằm trong chu kỳ 5 phút hiện tại, nó đè (update) vào cây nến cuối cùng (cập nhật High, Low, Close). Nếu vừa qua phút thứ 5, nó đóng nến cũ và mở một Object nến OHLCV mới toanh.
*   Cơ chế **Fallback cực hay**: Nếu `socket.onclose` kích hoạt (mất mạng), Store bật một `setInterval` ở local, tự động dùng `Math.random` nội suy để giá vẫn nhảy trên UI, không làm gián đoạn trải nghiệm người học.

**File `frontend/src/components/simulation/StockChart.jsx`**
*   Sử dụng thư viện (như Lightweight Charts) để ánh xạ mảng dữ liệu OHLCV từ `marketStore` thành biểu đồ trực quan. 
*   Quản lý các sự kiện thay đổi khung thời gian (Timeframe) và vẽ các đường chỉ báo kỹ thuật (Technical Indicators).

> **KẾT LUẬN CỦA COMPONENT MARKET SIMULATION:**
> *   **Về Backend:** Giải quyết bài toán **Tạo sinh dữ liệu (Data Generation)** cực khó bằng mô hình toán học tài chính cao cấp (Merton, GBM, Momentum), đảm bảo tính chân thực tuyệt đối mà không cần phụ thuộc sàn thật. Giải quyết bài toán hiệu năng bằng thiết kế lưu trữ nến gộp 5-phút thông minh.
> *   **Về Frontend:** Giải quyết bài toán **Đồng bộ trạng thái thời gian thực (Real-time State Synchronization)**. Nhận dữ liệu stream với tốc độ cao, bóc tách và render lại hàng trăm cây nến lên giao diện mượt mà (60fps) mà không gây giật lag trình duyệt.

---

# PHẦN 2: NEWS & SCENARIO (TIN TỨC & KỊCH BẢN THỊ TRƯỜNG)

Nếu Market Simulation là "Thân xác" vật lý, thì News & Scenario chính là "Linh hồn" tạo ra các chấn động tâm lý học cho thị trường ảo, đem lại giá trị sư phạm cốt lõi.

## Bước 1: Từ Đặc tả yêu cầu phần mềm (SRS)

1.  **Mục tiêu:** Hệ thống cần dạy người học cách thị trường phản ứng với tin tức vĩ mô (vd: FED tăng lãi suất, công ty phá sản) thay vì chỉ giao dịch mù quáng theo kỹ thuật.
2.  **Yêu cầu chức năng (FR-MKT-5 & FR-SOC):**
    *   Hỗ trợ kích hoạt các kịch bản thị trường (Market Scenarios).
    *   Bơm tin tức vĩ mô vào hệ thống để tác động lên giá cổ phiếu (News shocks).
3.  **Sự kiện:** Gồm 2 loại: **Ngắn hạn** (News - 1 bản tin ra lò làm giật giá cục bộ) và **Dài hạn** (Scenarios - Kịch bản thay đổi môi trường kéo dài nhiều tuần).

## Bước 2: Thiết kế hệ thống (System Design)

### 2.1 Thiết kế Cơ sở dữ liệu (ERD - Figure 3.10)
*   **Collection `news`**: Gồm các trường cốt lõi: `headline` (Tựa đề tin), `sentiment` (Chỉ số cảm xúc: Positive/Negative), `affectedTickers` (Danh sách mã bị dính đòn), `impact` (Cường độ mạnh/nhẹ của tin tức).
*   **Scenarios**: Không lưu trong DB dưới dạng cấu hình tĩnh mà là các thông số Runtime (ghi đè trực tiếp trên RAM của Engine sinh giá).

### 2.2 Kiến trúc Lớp (BCE & Control Logic)
Thành phần này được thiết kế theo mô hình **Sự kiện Tác động (Event-driven Mutation)**:
*   `NewsInjector` (Service) đóng vai trò thợ săn tin. Nó đẩy dữ liệu vào Database (`news`), đồng thời gọi hàm can thiệp thẳng vào `SimulationEngine`.
*   `SimulationEngine` có sẵn các hàm public như `applyShock()` hoặc `setRegime()` để nhận lệnh thay đổi thông số.

## Bước 3: Lập trình mã nguồn chi tiết (Implementation)

### 3.1 Khối Backend
**File `backend/services/newsService.js`**
*   Làm nhiệm vụ cào (fetch) tin tức từ API bên ngoài (GNews, Marketaux). 
*   Nếu không có API Key, nó tự động fallback sang cơ chế **Sinh tin ảo** từ các khuôn mẫu (Templates) có sẵn. Dù là thật hay ảo, nó đều phải chạy qua khâu phân tích cú pháp (Parser) để tìm xem Ticker nào xuất hiện trong tiêu đề để xếp vào mảng `affectedTickers`.

**File `backend/services/newsInjector.js`**
*   *Động cơ chi phối giá (Market Manipulator)*: Khởi tạo một `setInterval` định kỳ (ví dụ mỗi giờ mô phỏng). Nó sẽ móc một tin tức từ `newsService`.
*   Phân tích `sentiment`: Nếu tin tức là Tốt (Positive), nó gọi `simulationEngine.applyShock(ticker, +0.05)` (tăng giá 5%). Nếu Xấu, nó truyền số âm.
*   **Mối liên hệ tuyệt đỉnh với `simulationEngine`:** Khi hàm `applyShock()` được kích hoạt trong Engine, nó không chỉ cộng giá! Nó đẩy biến `volCluster` (Cụm độ biến động GARCH) lên cực cao. Có nghĩa là sau tin tức, biểu đồ không chỉ rớt giá, mà thân nến còn dao động và rung lắc cực kỳ mạnh, phản ánh chính xác sự hoảng loạn của tâm lý đám đông trong thực tế.

**File `backend/routes/scenarios.js`**
*   Cung cấp API cho Admin, ví dụ `POST /api/scenarios/tech_bubble/activate`. 
*   Khi kích hoạt, API này gọi `simulationEngine.setRegime('tech_bubble', { driftOverrides: { Tech: +0.02 }, volMultipliers: { Tech: 1.5 } })`. Ngay lập tức, thuật toán Toán học ở Phần 1 sẽ thay thế số `drift` tĩnh bằng biến số mới này, khiến các mã công nghệ tăng giá phi mã và liên tục phá đỉnh cho đến khi Admin tắt kịch bản.

### 3.2 Khối Frontend
**File `frontend/src/store/newsStore.js`**
*   Trạng thái cục bộ lưu trữ mảng tin tức. Có cơ chế tự động loại bỏ tin cũ, chèn tin mới lên đầu.

**File `frontend/src/components/simulation/NewsPanel.jsx`**
*   Một cửa sổ trượt (Scrolling feed) nằm trên giao diện Simulation.
*   Cơ chế UX: Khi Store ghi nhận có phần tử tin tức mới nhất vừa được thêm vào mảng, UI Component này bắt được tín hiệu thay đổi state $\rightarrow$ tự động kích hoạt một hiệu ứng CSS nhấp nháy (Flash animation đỏ hoặc xanh lá) và cuộn màn hình lên trên cùng.
*   **Trải nghiệm người học:** User đang nhìn biểu đồ bỗng thấy biểu đồ rớt thê thảm. Mắt họ liếc sang NewsPanel thấy đang chớp đỏ dòng tin "Công ty XYZ phá sản". Ngay lập tức sự kết nối nhân quả hình thành trong não bộ người học!

**File `frontend/src/components/shared/NewsModal.jsx` & `ScenarioSelector.jsx`**
*   Modal cho phép đọc chi tiết tin. Selector (dạng Dropdown) để tự chỉnh kịch bản vĩ mô theo ý muốn (dành cho chế độ thực hành đặc biệt).

> **KẾT LUẬN CỦA COMPONENT NEWS & SCENARIO:**
> *   **Về Backend:** Đây là thành quả tuyệt vời của thiết kế mô-đun (Modularity). Nhờ việc cô lập lõi toán học ở `SimulationEngine`, cụm `NewsInjector` và `Scenarios` có thể dễ dàng "kết nối" (hook) vào Engine để bóp méo thông số đầu vào (Drift, Volatility, Price) ở thời gian thực mà không làm vỡ cấu trúc code.
> *   **Về Frontend:** Tạo ra một "Lớp lang bối cảnh" (Contextual Overlay). Bằng cách kết nối UI của Bảng tin với những cú sốc hiển thị trên Biểu đồ, Frontend đã thành công trong việc mô phỏng lại một môi trường áp lực cao của các phòng giao dịch (Trading floor) chuyên nghiệp, nâng tầm ứng dụng từ một trò chơi điện tử thành một công cụ sư phạm tài chính thực thụ.
