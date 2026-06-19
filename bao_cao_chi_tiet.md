# Báo cáo: Mô phỏng lại Hiện tượng Lái xe Ban đêm trong Mô hình Bám đuôi (Car-Following)

**Đại học Bách khoa Hà Nội - Trường Công nghệ Thông tin và Truyền thông**

**Giảng viên hướng dẫn:** TS. Bùi Quốc Trung
**Nhóm tác giả:** 
1. Nguyễn Hải Đăng (20235484)
2. Vũ Nhật Nguyên Thư (20225462)
3. Nguyễn Minh Đức (20235587)
4. Võ Tá Quang Nhật (20225454)
5. Phan Đình Trung (20230093)

---

## 1. Giới thiệu (Introduction)

### 1.1. Các mô hình dòng giao thông và hành vi bám đuôi xe
Mô hình hóa dòng giao thông nghiên cứu cách các phương tiện di chuyển, tương tác và hình thành các mẫu hình (patterns) ở quy mô lớn như dòng xe chạy tự do, ùn tắc, sóng dừng-và-đi (stop-and-go waves), kẹt xe, v.v. Cách phân chia phổ biến nhất là giữa mô hình vĩ mô (macroscopic) và vi mô (microscopic). Các mô hình bám đuôi xe (car-following models) thuộc loại vi mô: gia tốc của mỗi tài xế phụ thuộc vào khoảng cách và độ chênh lệch tốc độ so với các phương tiện lân cận. Tài xế quan sát xe phía trước, ước lượng khoảng cách, phản ứng với tốc độ của xe đó và thay đổi tốc độ của mình cho phù hợp.

### 1.2. Lái xe ban ngày so với ban đêm (Normal vs Night Driving)
Trong điều kiện giao thông bình thường, khoảng cách giữa các xe càng lớn thì tốc độ cho phép càng cao. Tương đương với việc khi mật độ tăng, tốc độ trung bình có xu hướng giảm. Điều này tạo ra một mối quan hệ đơn điệu (monotone) giữa khoảng cách xe (headway) và tốc độ mong muốn: nếu khoảng cách tới xe phía trước lớn, tài xế cảm thấy an toàn hơn và chọn tốc độ cao hơn.

Bài báo tham chiếu của tác giả Jiang và Wu nghiên cứu một tình huống hoàn toàn khác: ô tô di chuyển vào ban đêm trên một con đường lạ. Ở mật độ rất thấp, tài xế không có hướng dẫn hình ảnh đáng tin cậy nào ngoài đèn pha của chính mình, do đó tốc độ bị giới hạn. Khi có một số xe phía trước, đèn hậu của chúng sẽ làm lộ ra hình dáng cong của con đường, giúp tài xế dễ dàng tự tin lái xe nhanh hơn. Tại mật độ cao, hiệu ứng ùn tắc bình thường quay trở lại và tốc độ lại giảm. Hiện tượng này tạo ra một hàm vận tốc tối ưu không đơn điệu (non-monotone): trong một khoảng cách nhất định, việc tăng khoảng cách lại làm giảm tốc độ mong muốn. Vùng có độ dốc âm (negative-slope region) này chính là cơ chế cốt lõi gây ra những sự mất ổn định bất thường khi lái xe ban đêm.

### 1.3. Mục tiêu (Objective)
Mục tiêu của báo cáo này là xác minh và giải thích mô hình tham chiếu, tiến hành lập trình mô phỏng lại các kết quả số học, đồng thời thảo luận về độ nhạy và tính vững (robustness) của các kết luận trong bài báo gốc. 

---

## 2. Phương pháp Mô hình hóa (Modelling Approach)

### 2.1. Lựa chọn phương pháp mô hình hóa
Báo cáo sử dụng mô hình "Full Velocity Difference" (FVD) - một mô hình car-following vi mô do Jiang et al. giới thiệu. Việc lựa chọn này mang lại 3 ưu điểm lớn:
1. **Tính vi mô:** Lái xe ban đêm phụ thuộc vào những gì tài xế nhìn thấy từ xe phía trước, vì vậy khoảng cách và tốc độ tương đối giữa các xe cụ thể cần phải được mô tả rõ.
2. **Hàm vận tốc tối ưu:** Mô hình duy trì một hàm vận tốc tối ưu $V(\Delta x)$, giúp dễ dàng mã hóa các giả định bất thường của lái xe ban đêm trực tiếp vào mô hình.
3. **Tính thực tế:** Mô hình FVD thực tế hơn mô hình vận tốc tối ưu cơ bản (OVM) vì tài xế còn phản ứng với việc xe phía trước đang tăng tốc rời đi hay đang phanh lại. Điều này giúp tránh hiện tượng gia tốc cao phi thực tế và cải thiện tốc độ lan truyền của sóng khởi hành.

Báo cáo cũng áp dụng **điều kiện biên tuần hoàn (periodic boundary conditions)**. Các phương tiện di chuyển trên một con đường vòng tròn có chiều dài $L = 500$. Điều này loại bỏ các hiệu ứng dòng xe đi vào hoặc đi ra ở hai đầu đường, đảm bảo rằng mọi cụm xe (cluster), sóng, hay sự mất ổn định quan sát được đều bắt nguồn từ quy luật tương tác nội tại giữa các xe.

### 2.2. Mô tả phương pháp
Khung toán học dựa trên mô hình FVD, mô phỏng cách mỗi tài xế điều chỉnh tốc độ dựa trên khoảng cách tới xe phía trước và chênh lệch tốc độ giữa hai xe. Trạng thái hệ thống tại thời điểm $t$ được xác định bởi vị trí $x_i(t)$ và vận tốc $v_i(t)$ của xe $i$.
Phương trình vi phân cốt lõi cho gia tốc là:
$$ \frac{dv_i}{dt} = \kappa [V(\Delta x_i) - v_i] + \lambda (v_{i+1} - v_i) $$
Trong đó:
- $\kappa$: Độ nhạy với vận tốc tối ưu.
- $\lambda$: Độ nhạy với tốc độ tương đối.
- $\Delta x_i = (x_{i+1} - x_i) \pmod L$: Khoảng cách giữa 2 xe (headway).
- $V(\Delta x)$: Hàm vận tốc tối ưu (tốc độ mục tiêu của tài xế dựa trên khoảng cách).

Hàm $V(\Delta x)$ được định nghĩa dưới dạng hàm từng đoạn (piecewise) trong điều kiện ban đêm:
- Nếu $\Delta x < x_{c1}$: $V(\Delta x) = \tanh(\Delta x - x_c) + \tanh(x_c)$ (giống lái bình thường).
- Nếu $x_{c1} \le \Delta x \le x_{c2}$: $V(\Delta x) = a - \Delta x$ (hàm bậc nhất giảm dần).
- Nếu $\Delta x > x_{c2}$: $V(\Delta x) = b$ (vận tốc thấp và hằng số).
Các tham số là: $x_c = 2, x_{c1} = 3.2, x_{c2} = 4, a = 5, b = 1$.

### 2.3. Giải thích về tính ổn định
Trong mô hình FVD chuẩn, các nhiễu nhỏ xung quanh dòng giao thông đồng đều sẽ ổn định tuyến tính trên nhánh có độ dốc dương khi:
$$ V'(\Delta x) < \frac{\kappa}{2} + \lambda $$
Tuy nhiên, hàm lái xe ban đêm chứa một nhánh có độ dốc âm ($V'(\Delta x) = -1$). Mô phỏng cho thấy dòng xe luôn luôn mất ổn định tại nhánh này. Điều này hợp lý về mặt vật lý: nếu khoảng cách lớn hơn khiến tài xế chọn tốc độ thấp hơn, thì một biến động khoảng cách nhỏ có thể bị khuếch đại thay vì bị dập tắt (positive feedback).

---

## 3. Thuật toán Giải quyết và Thiết kế Mô phỏng

### 3.1. Khởi tạo và Điều kiện biên tuần hoàn
Các thực nghiệm bắt đầu với dòng giao thông đồng đều. Vị trí ban đầu $x_i(0) = \frac{iL}{N}$, và vận tốc ban đầu là vận tốc tối ưu tương ứng với khoảng cách đó $V(L/N)$. Vị trí được lấy modulo $L$ để tạo thành vòng khép kín.

### 3.2. Sơ đồ cập nhật Euler
Sử dụng phương pháp Euler với bước thời gian $\Delta t = 0.1$ để cập nhật vận tốc và vị trí:
$$ v_{n+1}(t + \Delta t) = v_{n+1}(t) + a_{n+1}(t)\Delta t $$
$$ x_{n+1}(t + \Delta t) = x_{n+1}(t) + v_{n+1}(t)\Delta t + \frac{1}{2}a_{n+1}(t)(\Delta t)^2 $$

### 3.3. Thiết kế nhiễu (Perturbation design)
Đầu mô phỏng, dòng xe chạy đồng đều. Để tạo nhiễu, một chiếc xe được chọn và bị ép giảm tốc với mức gia tốc $a = -1$ trong suốt $n_{dec}$ bước thời gian. Sau đó, nó trở lại hoạt động theo mô hình FVD. Tham số $n_{dec}$ đo lường độ lớn của nhiễu ($n_{dec}$ nhỏ: nhiễu nhỏ; $n_{dec}$ lớn: nhiễu lớn).

### 3.4. Yếu tố ngẫu nhiên (Randomness factor)
Tác giả thêm thành phần ngẫu nhiên vào cập nhật vận tốc để mô phỏng các sai lệch của con người:
$$ v^*_{n+1} = v_{n+1}(t) + a_{n+1}(t)\Delta t + \text{rand}() \times A $$
Trong đó $\text{rand}()$ phân bố đều từ -0.5 đến 0.5, và $A$ là cường độ nhiễu ngẫu nhiên. Vận tốc được giới hạn không nhỏ hơn 0 và không vượt quá $v_{max} = V(3.2)$.

### 3.5. Quy trình mô phỏng
Quy trình mô phỏng lặp lại qua 10 bước chặt chẽ, từ thiết lập tham số, khởi tạo xe, áp dụng nhiễu, tính khoảng cách, tính gia tốc, cập nhật vị trí/vận tốc theo Euler, và giới hạn ngẫu nhiên.

---

## 4. Kết quả Thực nghiệm (Experimental Results)

Phần này trình bày chi tiết các kết quả phân tích hệ thống qua các hình ảnh minh họa trong báo cáo (được nhắc đến từ Figure 1 đến Figure 8).

### 4.1. Kết quả dưới tác động của nhiễu nhỏ ($n_{dec} = 1$)

#### 4.1.1. Nhiễu nhỏ với $\kappa = 1.0$ và $\lambda = 0.5$
**Phân tích Figure 1:** Hình 1 là biểu đồ không gian - thời gian (space-time plot) hiển thị quỹ đạo của các xe. Trục hoành là thời gian, trục tung là vị trí. Ban đầu dòng xe phân bố đều đặn. Khi bị nhiễu, thay vì tự ổn định lại, dòng xe tụ lại thành các khối dày đặc gọi là các **cụm (clusters)**. Xe đi đầu của mỗi cụm có khoảng cách phía trước cực lớn ($\Delta x > x_{c2}$), do đó nó chạy với vận tốc giới hạn là 1. Các xe phía sau bị kẹt lại và chạy bám theo thành từng dải sọc trên hình. Vùng trống giữa các cụm thể hiện đoạn đường không có xe. Đây là bằng chứng rõ ràng nhất về sự phá vỡ ổn định do khoảng độ dốc âm của hàm ban đêm.

#### 4.1.2. Nhiễu nhỏ với $\kappa = 1.0$ và $\lambda = 0.2$
Việc giảm độ nhạy $\lambda$ (khả năng phản ứng với chênh lệch vận tốc) làm hệ thống xuất hiện hai vùng mật độ bất ổn định khác nhau.
**Phân tích Figure 2:** 
- **(a) Đồ thị Fundamental diagram:** Đồ thị vẽ lưu lượng (Flow) theo mật độ (Density). Đường nét đứt xanh lá (Night driving with perturbation) có các đoạn lệch hẳn so với đường lý thuyết (màu cam). Các vùng chênh lệch này là vùng mất ổn định. Có hai vùng được đánh dấu: vùng giữa $k_{c2}$ và $k_{c3}$, và vùng giữa $k_{c3}$ và $k_{c4}$.
- **(b) Traffic pattern (Biểu đồ không gian - thời gian):** Ở vùng mật độ từ $k_{c3}$ đến $k_{c4}$, cấu trúc dòng xe không hình thành các cụm đơn lẻ mà tạo thành sóng **kink-antikink**. Trên hình vẽ, ta thấy các dải sọc đậm nhạt đan xen liên tục, thể hiện dòng xe lúc nén chặt lại (mật độ cao) lúc giãn ra (mật độ thấp) dưới dạng sóng lan truyền theo thời gian.

#### 4.1.3. Nhiễu nhỏ với $\kappa = 1.0$ và $\lambda = 0.1$
Khi $\lambda$ cực thấp, hệ thống vô cùng nhạy cảm và khó dập tắt nhiễu.
**Phân tích Figure 3:**
- **(a) Fundamental diagram:** Xuất hiện vùng dao động hỗn loạn ở đồ thị lưu lượng - mật độ từ $k_{c5}$ đến $k_{c6}$.
- **(b) Traffic pattern:** Dòng xe hình thành hai loại cụm: **Cụm ổn định (stable clusters)** ở vùng mật độ thấp hơn và **Cụm không ổn định (unstable clusters)** ở vùng cao hơn. Trên hình, ta thấy một khối cụm bị phá vỡ ở giữa (unstable) - chúng xuất hiện, tan vỡ rồi lại hình thành theo thời gian, khác với cụm ổn định (stable) giữ nguyên cấu trúc dải kéo dài. Đây là phát hiện rất quan trọng, hiếm gặp trong lý thuyết dòng giao thông thông thường.

### 4.2. Kết quả khi có yếu tố ngẫu nhiên (Randomness)
Báo cáo thêm nhiễu ngẫu nhiên biên độ $A$ để xem hành vi con người ảnh hưởng ra sao.
**Phân tích Figure 4:** Hình này so sánh hai mẫu traffic pattern khi không có yếu tố ngẫu nhiên. (a) Với $\kappa=1.0, \lambda=0.1$, ta thấy các cụm nhỏ không ổn định. (b) Với $\kappa=1.2, \lambda=0.0$, xuất hiện các đường nhiễu chéo hỗn loạn.
**Phân tích Figure 5:** Khảo sát ảnh hưởng của $A$ với mô hình có ngẫu nhiên ($N=300, \kappa=1.0, \lambda=0.1$):
- **(a) $A=0.01$**: Nhiễu ngẫu nhiên nhỏ lại vô tình dập tắt các dao động ký sinh, khiến các cụm trở nên hẹp hơn, sắc nét hơn và **ổn định hơn** so với khi không có nhiễu ngẫu nhiên.
- **(b) $A=0.05$**: Khi nhiễu tăng lên mức vừa phải, các cụm không ổn định (unstable clusters) quay trở lại, các dải cụm xuất hiện những khoảng gãy nứt.
- **(c) $A=0.1$**: Với nhiễu ngẫu nhiên lớn, cấu trúc cụm bị bóp lại rất hẹp, đồng thời tạo ra một dải tối khổng lồ đại diện cho một **vùng mật độ cao vĩ mô (macroscopic high-density region)**. Điều này cho thấy nhiễu ngẫu nhiên lớn hoàn toàn định hình lại pattern giao thông.

### 4.3. Kết quả dưới tác động của nhiễu lớn ($n_{dec} = 80$)
Nhiễu lớn kiểm tra **tính ổn định phi tuyến (nonlinear stability)**: ngay cả khi hệ thống an toàn với nhiễu nhỏ, một chiếc xe phanh gấp quá lâu ($n_{dec}=80$) có thể phá hủy hoàn toàn dòng xe.

#### 4.3.1. Nhiễu lớn với $\kappa = 1.0$ và $\lambda = 0.5$
**Phân tích Figure 6:** 
- **(a) Fundamental diagram:** Cho thấy khi chịu nhiễu lớn, dòng xe bị sụp đổ ổn định ở vùng mật độ thấp hơn một ngưỡng $k < k_{c7}$.
- **(b) One-cluster pattern:** Hình ảnh không gian - thời gian hiển thị duy nhất một dải đen (một cụm khổng lồ - one large cluster). Tất cả các xe cuối cùng bị dồn lại thành một đoàn duy nhất, với xe dẫn đầu chạy tốc độ $1$. Không có bất kỳ sóng dao động nào bên trong cụm.

#### 4.3.2. Nhiễu lớn với $\kappa = 1.0$ và $\lambda = 0.2$
**Phân tích Figure 7:**
- **(a) Fundamental diagram:** Ngưỡng mật độ mất ổn định được mở rộng.
- **(b) Cluster with density wave:** Trên biểu đồ, ta thấy dòng xe tạo thành một cụm lớn (dải rộng), tuy nhiên bên trong dải rộng này không phẳng mịn mà có các gợn sóng lượn sóng (density waves). Sóng kink-antikink kết hợp vào bên trong lòng của cụm khổng lồ, tạo thành hiện tượng "cụm chứa sóng" phức tạp.

#### 4.3.3. Nhiễu lớn với $\kappa = 1.0$ và $\lambda = 0.1$
**Phân tích Figure 8:**
Đồ thị Fundamental diagram (Hình 8) xác nhận rằng khi độ nhạy $\lambda$ càng thấp (phản ứng chậm với xe phía trước), ngưỡng mật độ mất ổn định do nhiễu lớn càng lan rộng (tăng lên). Hệ thống trở nên vô cùng kém bền vững (less robust).

---

## 5. Phân tích độ nhạy (Sensitivity Analysis)
Mô hình nhạy cảm chủ yếu với 3 nhóm tham số:
1. **Tham số độ nhạy của tài xế ($\kappa, \lambda$):** Quyết định sức mạnh phản xạ của tài xế. Giá trị cao giúp hệ thống ổn định và đơn giản. Giá trị thấp làm hệ thống dễ sinh ra các pattern phức tạp (kink-antikink, cụm bất ổn định).
2. **Kích thước nhiễu ($n_{dec}$):** Nhiễu nhỏ đánh giá ổn định tuyến tính. Nhiễu lớn (phanh gấp lâu) đánh giá ổn định phi tuyến, cho thấy hệ thống dù ổn định tuyến tính vẫn có thể sụp đổ thành các cụm lớn nếu cú phanh đủ mạnh.
3. **Biên độ ngẫu nhiên ($A$):** Tác động của $A$ không hề tuyến tính. $A$ nhỏ có thể làm hệ thống ổn định hơn (giúp gộp các cụm lại gọn gàng), trong khi $A$ lớn lại phá vỡ hệ thống, tạo ra những vùng ùn tắc vĩ mô cục bộ.

## 6. Kết luận
Báo cáo đã mô phỏng thành công các hiện tượng độc đáo trong hành vi lái xe ban đêm dựa trên mô hình FVD. Đặc điểm cốt lõi gây ra mọi sự bất ổn (instability) chính là vùng có "độ dốc âm" trong hàm vận tốc tối ưu ban đêm (do tầm nhìn hạn chế, khoảng cách tăng lại làm giảm tốc độ).
Nhóm đã tái tạo được đầy đủ các hành vi động lực học phức tạp như: cụm (clusters), sóng kink-antikink, cụm ổn định và không ổn định. Nhìn chung, tính bất ổn định do giảm tầm nhìn là một đặc tính vững (robust) của mô hình, tuy nhiên hình thái giao thông cuối cùng (traffic pattern) lại rất nhạy cảm và phụ thuộc mạnh vào các tham số $\kappa, \lambda, n_{dec}$ và độ nhiễu ngẫu nhiên $A$. Mô hình FVD chứng tỏ là một nền tảng toán học xuất sắc để nghiên cứu động lực học giao thông dưới điều kiện tầm nhìn bị hạn chế.
