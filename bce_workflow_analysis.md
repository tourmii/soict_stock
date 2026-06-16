# PHÂN TÍCH CHUYÊN SÂU BIỂU ĐỒ BCE: MARKET SIMULATION & STREAMING

Tài liệu này giải phẫu chi tiết biểu đồ **BCE Analysis: Market Simulation and Real-Time Streaming**. Chúng ta sẽ đi sâu vào từng thuộc tính (attributes), phương thức (methods) của mỗi Class, và sau đó ghép nối chúng lại thành một luồng hoạt động (Workflow) hoàn chỉnh từ Backend đến Frontend.

---

## PHẦN 1: GIẢI PHẪU CÁC CLASS TRONG BIỂU ĐỒ

Biểu đồ được chia thành 3 lớp tiêu chuẩn: **Entity (Thực thể dữ liệu)**, **Control (Điều khiển logic)**, và **Boundary (Giao diện người dùng)**.

### 1. LỚP ENTITY (THỰC THỂ DỮ LIỆU)
Đây là các đối tượng chứa dữ liệu thuần túy, đại diện cho những thứ tồn tại trong Database hoặc bộ nhớ.

#### 1.1. Class `Stock` (Cổ phiếu)
Đại diện cho bản chất vật lý của một mã chứng khoán trong mô phỏng.
*   **Thuộc tính (Attributes):**
    *   `ticker / name / fullName`: Thông tin định danh (Ví dụ: `SCT`, `SoictTech`, `SoictTech Corporation`).
    *   `sector`: Nhóm ngành (Tech, Finance, Energy...). Dùng để nhóm các cú sốc vĩ mô.
    *   `basePrice`: Giá nền tảng ban đầu. Dùng làm điểm neo cho lực hồi quy (Mean Reversion).
    *   `drift`: Tốc độ tăng trưởng dài hạn mặc định (Lực đẩy).
    *   `volatility`: Độ biến động mặc định (Độ rung lắc của nến).
*   **Phương thức / Chú thích:**
    *   `+ 12 base stock definitions`: Mảng tĩnh chứa 12 mã cổ phiếu mặc định.
    *   `+ simulation configuration`: Các thông số cấu hình tĩnh nạp vào động cơ.

#### 1.2. Class `Tick` (Biến động giá)
Đại diện cho một bản ghi giá lịch sử.
*   **Thuộc tính:**
    *   `ticker`: Mã cổ phiếu.
    *   `time`: Mốc thời gian (Unix Timestamp tính bằng giây).
    *   `price`: Giá đóng cửa của mốc thời gian đó.
    *   `volume`: Khối lượng giao dịch.
*   **Phương thức / Chú thích:**
    *   `+ persisted as 5-minute bar`: Được lưu xuống Database dưới dạng nến 5-phút để tối ưu dung lượng.
    *   `+ aggregated into OHLCV`: Khi gọi lên Frontend, nó sẽ được thuật toán gộp lại thành nến 15m, 1H, 1D (Mở-Cao-Thấp-Đóng-Khối lượng).

---

### 2. LỚP CONTROL (ĐIỀU KHIỂN LOGIC)
Đây là "bộ não" của hệ thống, thực hiện tính toán, lấy dữ liệu và truyền tải.

#### 2.1. Class `SimulationEngine` (Backend)
Động cơ toán học cốt lõi sinh ra giá.
*   **Thuộc tính:**
    *   `stocks`: Danh sách các đối tượng `Stock` nạp vào RAM.
    *   `prices`: Lưu trữ mức giá hiện tại (`current price`) của toàn bộ 12 mã ở từng giây.
    *   `regime`: Chế độ vĩ mô hiện tại (Bình thường / Bong bóng / Khủng hoảng).
    *   `tick listeners`: Danh sách các hàm (callbacks) đang lắng nghe mỗi khi có giá mới sinh ra.
*   **Phương thức:**
    *   `initialize()`: Khởi động Engine, đọc DB, nếu DB trống thì tự động sinh nến lịch sử 30 ngày.
    *   `start()`: Bật vòng lặp thời gian vô tận (cứ 3 giây chạy 1 lần).
    *   `onTick()`: Hàm kích hoạt Toán học (Merton Jump-Diffusion) để nặn ra giá mới cho nhịp hiện tại.
    *   `getRecentHistory(30)`: Truy vấn DB lấy nến 5-phút của 30 ngày gần nhất.
    *   `getTickHistory()`: Lấy lịch sử giá chi tiết.
    *   `setRegime()`: Ghi đè biến `regime`, ép đồ thị chạy theo kịch bản do Admin chọn.

#### 2.2. Class `PriceStream` (Backend)
Trạm trung chuyển dữ liệu qua giao thức WebSocket.
*   **Thuộc tính:**
    *   `connected WebSocket clients`: Danh sách các trình duyệt của người dùng đang mở kết nối.
    *   `engineReady`: Biến Boolean kiểm tra xem `SimulationEngine` đã load xong lịch sử chưa.
*   **Phương thức:**
    *   `setupPriceStream()`: Mở cổng WebSocket `/ws` để nhận kết nối từ Frontend.
    *   `broadcastProgress()`: Bắn phần trăm tiến độ (0% -> 100%) xuống Frontend khi Engine đang mải sinh nến 30 ngày lịch sử.
    *   `broadcastReady()`: Báo hiệu "Engine đã nạp đạn xong, chuẩn bị nhận giá!".
    *   `send loading/init/tick`: Hàm bắn gói tin chứa mảng giá mới nhất xuống toàn bộ `clients`.

#### 2.3. Class `MarketStore` (Frontend)
Kho chứa State toàn cục ở trình duyệt (Dùng Zustand hoặc Redux).
*   **Thuộc tính:**
    *   `prices / prevPrices`: Lưu giá hiện tại và giá ngay trước đó (để so sánh làm chớp màu xanh/đỏ trên UI).
    *   `rawTicks`: Mảng tạm chứa các giá nhấp nháy trong 3 giây để chuẩn bị gộp thành nến.
    *   `historicalOHLCV`: Mảng lớn chứa toàn bộ lịch sử nến kéo từ DB về.
    *   `isConnected / isLoading`: Trạng thái mạng (có đứt cáp không) và trạng thái chờ load dữ liệu.
*   **Phương thức:**
    *   `initFromServer()`: Hàm khởi tạo, gọi lệnh mở WebSocket nối tới `PriceStream`.
    *   `updatePrices()`: Hàm hứng gói tin từ WebSocket, cập nhật vào mảng `prices` và kích hoạt vẽ biểu đồ.
    *   `getOHLCVWithHistory()`: Thuật toán gộp nến (Aggregation) biến nến 5-phút thành 15m, 1H.
    *   `fetchHistoricalOHLCV()`: Fetch dữ liệu quá khứ tĩnh.
    *   `simulateTick()`: **Tính năng Fallback cực xịn!** Nếu `isConnected == false` (mất mạng), nó tự random giá ảo ở local để biểu đồ vẫn nhảy múa.

---

### 3. LỚP BOUNDARY (GIAO DIỆN HIỂN THỊ)
Giao diện trực tiếp đập vào mắt người dùng, hoàn toàn thụ động chờ State thay đổi.

#### 3.1. Class `SimulationPage` (Frontend)
Trang chính bọc bên ngoài.
*   **Thuộc tính:**
    *   `composes terminal panels`: Chứa các khung giao diện con (Bảng tin, Khung Order, Chart).
    *   `observes loading/connection state`: Lắng nghe biến `isLoading` từ Store.
*   **Phương thức:**
    *   `renderMarketTerminal()`: Render ra sàn giao dịch đầy đủ tính năng.
    *   `showInitializationProgress()`: Bật màn hình Loading có vòng xoay và thanh Progress bar che lấp màn hình khi Server đang sinh nến.

#### 3.2. Class `StockChart` (Frontend)
Biểu đồ kỹ thuật.
*   **Thuộc tính:**
    *   `selectedTicker`: Mã đang xem (VD: SCT).
    *   `timeframe`: Khung thời gian đang chọn (15m, 1D...).
    *   `active indicators`: Danh sách chỉ báo kỹ thuật đang bật (MA, Bollinger Bands).
*   **Phương thức:**
    *   `renderCandles()`: Vẽ thân nến và râu nến.
    *   `renderVolume()`: Vẽ cột thanh khoản ở dưới cùng.
    *   `toggleSMA/EMA/BB()`: Bật/tắt các đường chỉ báo đè lên biểu đồ.

---
<br/>

## PHẦN 2: LUỒNG HOẠT ĐỘNG END-TO-END (THE WORKFLOW)

Đây là cách dòng máu dữ liệu lưu thông qua các huyết mạch của hệ thống, dựa trên các mũi tên kết nối trong biểu đồ:

### Giai đoạn 1: Server Khởi động (Backend Initialization)
1.  **Đọc cấu hình:** Lớp `SimulationEngine` khởi động, nhìn vào đường nối `uses definitions` để nạp các Entity `Stock` vào bộ nhớ.
2.  **Truy vấn lịch sử:** Nó gọi hàm `initialize()` $\rightarrow$ gọi tiếp `getRecentHistory(30)` để query MongoDB.
3.  Nếu Database rỗng, nó vã mồ hôi chạy thuật toán sinh nến 30 ngày. Trong lúc chạy, nó liên tục báo tiến độ qua `PriceStream`. 
4.  `PriceStream` dùng `broadcastProgress()` bắn phần trăm tiến trình qua mạng.
5.  Hoàn tất, `SimulationEngine` ghi (Insert) dữ liệu vào bảng MongoDB (đường nối `generates / persists` tới `Tick`), và báo `engineReady = true`.

### Giai đoạn 2: Trình duyệt Truy cập (Frontend Handshake)
1.  User vào web, Boundary `SimulationPage` được render. 
2.  `SimulationPage` nhìn vào `MarketStore`, thấy `isLoading = true` liền gọi hàm `showInitializationProgress()` để hiện màn hình Loading che web lại.
3.  `MarketStore` gọi `initFromServer()`, bắt đầu vươn cái vòi `WebSocket /ws` sang `PriceStream`.
4.  `PriceStream` nhận vòi, móc mảng `history` từ `SimulationEngine` và bắn một cục khổng lồ (`send init`) về Frontend.
5.  `MarketStore` hứng mảng, lưu vào `historicalOHLCV`, đổi `isLoading = false`.
6.  `SimulationPage` thấy tải xong, tắt Loading, gọi `renderMarketTerminal()` để hiển thị giao diện. Giao diện truyền cục OHLCV (đường nối `provides OHLCV`) sang `StockChart` để nó gọi `renderCandles()` vẽ quá khứ.

### Giai đoạn 3: Cuộc chiến Real-time (The Live Market)
1.  **Sinh giá:** `SimulationEngine` chạy hàm `start()` mở vòng lặp 3 giây. Cứ 3s nó gọi `onTick()`. Dùng công thức toán nặn ra mốc giá mới.
2.  **Kích hoạt luồng:** Engine báo cho `PriceStream` thông qua mảng `tick listeners`.
3.  **Truyền phát:** `PriceStream` dùng `send tick` bắn cục giá mới qua WebSocket.
4.  **Cập nhật State:** Ở Frontend, `MarketStore` hứng được giá. Hàm `updatePrices()` chạy, lưu giá cũ vào `prevPrices`, giá mới vào `prices`.
5.  **Re-render:** Boundary `StockChart` phát hiện State của Store thay đổi, tự động bốc lấy dữ liệu mới (`provides OHLCV`). Hàm `renderCandles()` vẽ ra cây nến đang chớp màu, râu nến giật lên giật xuống.

### Giai đoạn 4: Lưu trữ (Persistence) & Rủi ro (Fallback)
1.  **Backend lưu DB:** Không phải tick nào cũng lưu DB! Cứ đúng 300 giây (5 phút), `SimulationEngine` gom các tick lại thành một nến Entity `Tick` và chạy ngầm lệnh Insert vào MongoDB (`generates / persists`).
2.  **Mất mạng (Fallback):** Giả sử sinh viên rút dây mạng. Kết nối WebSocket đứt. `MarketStore` ghi nhận `isConnected = false`. Ngay lập tức, nó gọi hàm `simulateTick()`. Hàm này tự chạy local, mồi random thêm chút giá ảo để `prices` tiếp tục thay đổi. `StockChart` không hề hay biết đã đứt mạng, vẫn lấy OHLCV và tiếp tục render như không có chuyện gì xảy ra! Trải nghiệm người dùng không bị gãy vỡ. 

> **💡 Mẹo chốt câu trả lời:** *"Nhờ phân chia rõ ràng trách nhiệm Boundary (Giao diện) - Control (Logic) - Entity (Dữ liệu), hệ thống có khả năng bơm hàng ngàn điểm giá mỗi giây qua WebSocket mà code Frontend không bị dính chặt (coupled) vào Backend, đồng thời Database được bảo vệ tuyệt đối do chỉ lưu nến 5 phút."*
