const fs = require('fs');
const path = require('path');

const locations = {
  'TP. Hồ Chí Minh': [
    // TP. Thủ Đức (toàn bộ 34 phường)
    'Phường An Khánh, TP. Thủ Đức', 'Phường An Lợi Đông, TP. Thủ Đức', 'Phường An Phú, TP. Thủ Đức',
    'Phường Bình Chiểu, TP. Thủ Đức', 'Phường Bình Thọ, TP. Thủ Đức', 'Phường Bình Trưng Đông, TP. Thủ Đức',
    'Phường Bình Trưng Tây, TP. Thủ Đức', 'Phường Cát Lái, TP. Thủ Đức', 'Phường Hiệp Bình Chánh, TP. Thủ Đức',
    'Phường Hiệp Bình Phước, TP. Thủ Đức', 'Phường Hiệp Phú, TP. Thủ Đức', 'Phường Linh Chiểu, TP. Thủ Đức',
    'Phường Linh Đông, TP. Thủ Đức', 'Phường Linh Tây, TP. Thủ Đức', 'Phường Linh Trung, TP. Thủ Đức',
    'Phường Linh Xuân, TP. Thủ Đức', 'Phường Long Bình, TP. Thủ Đức', 'Phường Long Phước, TP. Thủ Đức',
    'Phường Long Thạnh Mỹ, TP. Thủ Đức', 'Phường Long Trường, TP. Thủ Đức', 'Phường Phú Hữu, TP. Thủ Đức',
    'Phường Phước Bình, TP. Thủ Đức', 'Phường Phước Long A, TP. Thủ Đức', 'Phường Phước Long B, TP. Thủ Đức',
    'Phường Tam Bình, TP. Thủ Đức', 'Phường Tam Phú, TP. Thủ Đức', 'Phường Tăng Nhơn Phú A, TP. Thủ Đức',
    'Phường Tăng Nhơn Phú B, TP. Thủ Đức', 'Phường Thạnh Mỹ Lợi, TP. Thủ Đức', 'Phường Thảo Điền, TP. Thủ Đức',
    'Phường Thủ Thiêm, TP. Thủ Đức', 'Phường Trường Thạnh, TP. Thủ Đức', 'Phường Trường Thọ, TP. Thủ Đức',

    // Quận 1 (10 phường đầy đủ)
    'Phường Bến Nghé, Quận 1', 'Phường Bến Thành, Quận 1', 'Phường Cầu Kho, Quận 1', 'Phường Cầu Ông Lãnh, Quận 1',
    'Phường Cô Giang, Quận 1', 'Phường Đa Kao, Quận 1', 'Phường Nguyễn Cư Trinh, Quận 1',
    'Phường Nguyễn Thái Bình, Quận 1', 'Phường Phạm Ngũ Lão, Quận 1', 'Phường Tân Định, Quận 1',

    // Quận 3 (theo NQ 1278/NQ-UBTVQH15 mới nhất có hiệu lực 2025)
    'Phường Võ Thị Sáu, Quận 3', 'Phường 1, Quận 3', 'Phường 2, Quận 3', 'Phường 3, Quận 3',
    'Phường 4, Quận 3', 'Phường 5, Quận 3', 'Phường 9, Quận 3 (sáp nhập P.9 & P.10)',
    'Phường 11, Quận 3 (sáp nhập P.11 & P.12)', 'Phường 14, Quận 3 (sáp nhập P.13 & P.14)',
    'Phường Nhiêu Lộc, Quận 3', 'Phường Bàn Cờ, Quận 3', 'Phường Xuân Hòa, Quận 3',

    // Quận 4 (theo NQ 1278/NQ-UBTVQH15 mới nhất)
    'Phường 1, Quận 4', 'Phường 2, Quận 4', 'Phường 3, Quận 4', 'Phường 4, Quận 4',
    'Phường 8, Quận 4', 'Phường 9, Quận 4 (sáp nhập P.6 & P.9)', 'Phường 13, Quận 4',
    'Phường 14, Quận 4', 'Phường 15, Quận 4', 'Phường 16, Quận 4', 'Phường 18, Quận 4',
    'Phường Xóm Chiếu, Quận 4', 'Phường Khánh Hội, Quận 4', 'Phường Vĩnh Hội, Quận 4',

    // Quận 5 (theo NQ 1278/NQ-UBTVQH15 mới nhất)
    'Phường 1, Quận 5', 'Phường 2, Quận 5 (sáp nhập P.2 & P.3)', 'Phường 4, Quận 5',
    'Phường 5, Quận 5 (sáp nhập P.5 & P.6)', 'Phường 7, Quận 5 (sáp nhập P.7 & P.8)',
    'Phường 9, Quận 5', 'Phường 11, Quận 5 (sáp nhập P.10 & P.11)', 'Phường 12, Quận 5',
    'Phường 13, Quận 5', 'Phường 14, Quận 5',

    // Quận 6 (14 phường)
    'Phường 1, Quận 6', 'Phường 2, Quận 6', 'Phường 3, Quận 6', 'Phường 4, Quận 6',
    'Phường 5, Quận 6', 'Phường 6, Quận 6', 'Phường 7, Quận 6', 'Phường 8, Quận 6',
    'Phường 9, Quận 6', 'Phường 10, Quận 6', 'Phường 11, Quận 6', 'Phường 12, Quận 6',
    'Phường 13, Quận 6', 'Phường 14, Quận 6',

    // Quận 7 (10 phường đầy đủ)
    'Phường Tân Thuận Đông, Quận 7', 'Phường Tân Thuận Tây, Quận 7', 'Phường Tân Kiểng, Quận 7',
    'Phường Tân Hưng, Quận 7', 'Phường Bình Thuận, Quận 7', 'Phường Tân Quy, Quận 7',
    'Phường Phú Thuận, Quận 7', 'Phường Tân Phong, Quận 7', 'Phường Phú Mỹ, Quận 7', 'Phường Tân Phú, Quận 7',

    // Quận 8 (theo NQ 1278/NQ-UBTVQH15 mới nhất)
    'Phường 1, Quận 8', 'Phường 2, Quận 8', 'Phường 3, Quận 8', 'Phường 4, Quận 8',
    'Phường 5, Quận 8', 'Phường 8, Quận 8', 'Phường 9, Quận 8', 'Phường 14, Quận 8',
    'Phường 15, Quận 8', 'Phường 16, Quận 8', 'Phường Rạch Ông, Quận 8',
    'Phường Hưng Phú, Quận 8', 'Phường Xóm Củi, Quận 8',

    // Quận 10 (14 phường đầy đủ)
    'Phường 1, Quận 10', 'Phường 2, Quận 10', 'Phường 4, Quận 10', 'Phường 5, Quận 10',
    'Phường 6, Quận 10', 'Phường 7, Quận 10', 'Phường 8, Quận 10', 'Phường 9, Quận 10',
    'Phường 10, Quận 10', 'Phường 11, Quận 10', 'Phường 12, Quận 10', 'Phường 13, Quận 10',
    'Phường 14, Quận 10', 'Phường 15, Quận 10',

    // Quận 11 (16 phường đầy đủ)
    'Phường 1, Quận 11', 'Phường 2, Quận 11', 'Phường 3, Quận 11', 'Phường 4, Quận 11',
    'Phường 5, Quận 11', 'Phường 6, Quận 11', 'Phường 7, Quận 11', 'Phường 8, Quận 11',
    'Phường 9, Quận 11', 'Phường 10, Quận 11', 'Phường 11, Quận 11', 'Phường 12, Quận 11',
    'Phường 13, Quận 11', 'Phường 14, Quận 11', 'Phường 15, Quận 11', 'Phường 16, Quận 11',

    // Quận 12 (11 phường đầy đủ)
    'Phường An Phú Đông, Quận 12', 'Phường Đông Hưng Thuận, Quận 12', 'Phường Hiệp Thành, Quận 12',
    'Phường Tân Chánh Hiệp, Quận 12', 'Phường Tân Hưng Thuận, Quận 12', 'Phường Tân Thới Hiệp, Quận 12',
    'Phường Tân Thới Nhất, Quận 12', 'Phường Thạnh Lộc, Quận 12', 'Phường Thạnh Xuân, Quận 12',
    'Phường Thới An, Quận 12', 'Phường Trung Mỹ Tây, Quận 12',

    // Quận Bình Thạnh (20 phường)
    'Phường 1, Quận Bình Thạnh', 'Phường 2, Quận Bình Thạnh', 'Phường 3, Quận Bình Thạnh',
    'Phường 5, Quận Bình Thạnh', 'Phường 6, Quận Bình Thạnh', 'Phường 7, Quận Bình Thạnh',
    'Phường 11, Quận Bình Thạnh', 'Phường 12, Quận Bình Thạnh', 'Phường 13, Quận Bình Thạnh',
    'Phường 14, Quận Bình Thạnh', 'Phường 15, Quận Bình Thạnh', 'Phường 17, Quận Bình Thạnh',
    'Phường 19, Quận Bình Thạnh', 'Phường 21, Quận Bình Thạnh', 'Phường 22, Quận Bình Thạnh',
    'Phường 24, Quận Bình Thạnh', 'Phường 25, Quận Bình Thạnh', 'Phường 26, Quận Bình Thạnh',
    'Phường 27, Quận Bình Thạnh', 'Phường 28, Quận Bình Thạnh',

    // Quận Gò Vấp (16 phường)
    'Phường 1, Quận Gò Vấp', 'Phường 3, Quận Gò Vấp', 'Phường 4, Quận Gò Vấp',
    'Phường 5, Quận Gò Vấp', 'Phường 6, Quận Gò Vấp', 'Phường 7, Quận Gò Vấp',
    'Phường 8, Quận Gò Vấp', 'Phường 9, Quận Gò Vấp', 'Phường 10, Quận Gò Vấp',
    'Phường 11, Quận Gò Vấp', 'Phường 12, Quận Gò Vấp', 'Phường 13, Quận Gò Vấp',
    'Phường 14, Quận Gò Vấp', 'Phường 15, Quận Gò Vấp', 'Phường 16, Quận Gò Vấp',
    'Phường 17, Quận Gò Vấp',

    // Quận Phú Nhuận (13 phường)
    'Phường 1, Quận Phú Nhuận', 'Phường 2, Quận Phú Nhuận', 'Phường 3, Quận Phú Nhuận',
    'Phường 4, Quận Phú Nhuận', 'Phường 5, Quận Phú Nhuận', 'Phường 7, Quận Phú Nhuận',
    'Phường 8, Quận Phú Nhuận', 'Phường 9, Quận Phú Nhuận', 'Phường 10, Quận Phú Nhuận',
    'Phường 11, Quận Phú Nhuận', 'Phường 13, Quận Phú Nhuận', 'Phường 15, Quận Phú Nhuận',
    'Phường 17, Quận Phú Nhuận',

    // Quận Tân Bình (15 phường)
    'Phường 1, Quận Tân Bình', 'Phường 2, Quận Tân Bình', 'Phường 3, Quận Tân Bình',
    'Phường 4, Quận Tân Bình', 'Phường 5, Quận Tân Bình', 'Phường 6, Quận Tân Bình',
    'Phường 7, Quận Tân Bình', 'Phường 8, Quận Tân Bình', 'Phường 9, Quận Tân Bình',
    'Phường 10, Quận Tân Bình', 'Phường 11, Quận Tân Bình', 'Phường 12, Quận Tân Bình',
    'Phường 13, Quận Tân Bình', 'Phường 14, Quận Tân Bình', 'Phường 15, Quận Tân Bình',

    // Quận Tân Phú (11 phường)
    'Phường Hiệp Tân, Quận Tân Phú', 'Phường Hòa Thạnh, Quận Tân Phú', 'Phường Phú Thạnh, Quận Tân Phú',
    'Phường Phú Thọ Hòa, Quận Tân Phú', 'Phường Phú Trung, Quận Tân Phú', 'Phường Sơn Kỳ, Quận Tân Phú',
    'Phường Tân Quý, Quận Tân Phú', 'Phường Tân Sơn Nhì, Quận Tân Phú', 'Phường Tân Thành, Quận Tân Phú',
    'Phường Tân Thới Hòa, Quận Tân Phú', 'Phường Tây Thạnh, Quận Tân Phú',

    // Quận Bình Tân (10 phường)
    'Phường An Lạc, Quận Bình Tân', 'Phường An Lạc A, Quận Bình Tân', 'Phường Bình Hưng Hòa, Quận Bình Tân',
    'Phường Bình Hưng Hòa A, Quận Bình Tân', 'Phường Bình Hưng Hòa B, Quận Bình Tân',
    'Phường Bình Trị Đông, Quận Bình Tân', 'Phường Bình Trị Đông A, Quận Bình Tân',
    'Phường Bình Trị Đông B, Quận Bình Tân', 'Phường Tân Tạo, Quận Bình Tân', 'Phường Tân Tạo A, Quận Bình Tân',

    // Huyện Bình Chánh
    'Thị trấn Tân Túc, Huyện Bình Chánh', 'Xã An Phú Tây, Huyện Bình Chánh', 'Xã Bình Chánh, Huyện Bình Chánh',
    'Xã Bình Hưng, Huyện Bình Chánh', 'Xã Bình Lợi, Huyện Bình Chánh', 'Xã Đa Phước, Huyện Bình Chánh',
    'Xã Hưng Long, Huyện Bình Chánh', 'Xã Lê Minh Xuân, Huyện Bình Chánh', 'Xã Phạm Văn Hai, Huyện Bình Chánh',
    'Xã Phong Phú, Huyện Bình Chánh', 'Xã Quy Đức, Huyện Bình Chánh', 'Xã Tân Kiên, Huyện Bình Chánh',
    'Xã Tân Nhựt, Huyện Bình Chánh', 'Xã Tân Quý Tây, Huyện Bình Chánh', 'Xã Vĩnh Lộc A, Huyện Bình Chánh',
    'Xã Vĩnh Lộc B, Huyện Bình Chánh',

    // Huyện Hóc Môn
    'Thị trấn Hóc Môn, Huyện Hóc Môn', 'Xã Bà Điểm, Huyện Hóc Môn', 'Xã Đông Thạnh, Huyện Hóc Môn',
    'Xã Nhị Bình, Huyện Hóc Môn', 'Xã Tân Hiệp, Huyện Hóc Môn', 'Xã Tân Thới Nhì, Huyện Hóc Môn',
    'Xã Tân Xuân, Huyện Hóc Môn', 'Xã Thới Tam Thôn, Huyện Hóc Môn', 'Xã Trung Chánh, Huyện Hóc Môn',
    'Xã Xuân Thới Đông, Huyện Hóc Môn', 'Xã Xuân Thới Sơn, Huyện Hóc Môn', 'Xã Xuân Thới Thượng, Huyện Hóc Môn',

    // Huyện Củ Chi
    'Thị trấn Củ Chi, Huyện Củ Chi', 'Xã An Nhơn Tây, Huyện Củ Chi', 'Xã An Phú, Huyện Củ Chi',
    'Xã Bình Mỹ, Huyện Củ Chi', 'Xã Hòa Phú, Huyện Củ Chi', 'Xã Nhuận Đức, Huyện Củ Chi',
    'Xã Phạm Văn Cội, Huyện Củ Chi', 'Xã Phú Hòa Đông, Huyện Củ Chi', 'Xã Phú Mỹ Hưng, Huyện Củ Chi',
    'Xã Tân An Hội, Huyện Củ Chi', 'Xã Tân Thạnh Đông, Huyện Củ Chi', 'Xã Tân Thạnh Tây, Huyện Củ Chi',
    'Xã Tân Thông Hội, Huyện Củ Chi', 'Xã Thái Mỹ, Huyện Củ Chi', 'Xã Trung An, Huyện Củ Chi',
    'Xã Trung Lập Hạ, Huyện Củ Chi', 'Xã Trung Lập Thượng, Huyện Củ Chi',

    // Huyện Nhà Bè
    'Thị trấn Nhà Bè, Huyện Nhà Bè', 'Xã Hiệp Phước, Huyện Nhà Bè', 'Xã Long Thới, Huyện Nhà Bè',
    'Xã Nhơn Đức, Huyện Nhà Bè', 'Xã Phú Xuân, Huyện Nhà Bè', 'Xã Phước Kiển, Huyện Nhà Bè',
    'Xã Phước Lộc, Huyện Nhà Bè',

    // Huyện Cần Giờ
    'Thị trấn Cần Thạnh, Huyện Cần Giờ', 'Xã An Thới Đông, Huyện Cần Giờ', 'Xã Bình Khánh, Huyện Cần Giờ',
    'Xã Long Hòa, Huyện Cần Giờ', 'Xã Lý Nhơn, Huyện Cần Giờ', 'Xã Tam Thôn Hiệp, Huyện Cần Giờ',
    'Xã Thạnh An, Huyện Cần Giờ'
  ],

  'Hà Nội': [
    // Quận Ba Đình
    'Phường Cống Vị, Quận Ba Đình', 'Phường Điện Biên, Quận Ba Đình', 'Phường Đội Cấn, Quận Ba Đình',
    'Phường Giảng Võ, Quận Ba Đình', 'Phường Kim Mã, Quận Ba Đình', 'Phường Liễu Giai, Quận Ba Đình',
    'Phường Ngọc Hà, Quận Ba Đình', 'Phường Ngọc Khánh, Quận Ba Đình', 'Phường Nguyễn Trung Trực, Quận Ba Đình',
    'Phường Phúc Xá, Quận Ba Đình', 'Phường Quán Thánh, Quận Ba Đình', 'Phường Thành Công, Quận Ba Đình',
    'Phường Trúc Bạch, Quận Ba Đình', 'Phường Vĩnh Phúc, Quận Ba Đình',

    // Quận Hoàn Kiếm (theo NQ 1104/NQ-UBTVQH15)
    'Phường Chương Dương, Quận Hoàn Kiếm', 'Phường Cửa Đông, Quận Hoàn Kiếm', 'Phường Cửa Nam, Quận Hoàn Kiếm',
    'Phường Đồng Xuân, Quận Hoàn Kiếm', 'Phường Hàng Bạc, Quận Hoàn Kiếm', 'Phường Hàng Bài, Quận Hoàn Kiếm',
    'Phường Hàng Bồ, Quận Hoàn Kiếm', 'Phường Hàng Bông, Quận Hoàn Kiếm', 'Phường Hàng Buồm, Quận Hoàn Kiếm',
    'Phường Hàng Đào, Quận Hoàn Kiếm', 'Phường Hàng Gai, Quận Hoàn Kiếm', 'Phường Hàng Mã, Quận Hoàn Kiếm',
    'Phường Hàng Trống, Quận Hoàn Kiếm', 'Phường Lý Thái Tổ, Quận Hoàn Kiếm', 'Phường Phan Chu Trinh, Quận Hoàn Kiếm',
    'Phường Phúc Tân, Quận Hoàn Kiếm', 'Phường Tràng Tiền, Quận Hoàn Kiếm', 'Phường Trần Hưng Đạo, Quận Hoàn Kiếm',

    // Quận Cầu Giấy
    'Phường Dịch Vọng, Quận Cầu Giấy', 'Phường Dịch Vọng Hậu, Quận Cầu Giấy', 'Phường Mai Dịch, Quận Cầu Giấy',
    'Phường Nghĩa Đô, Quận Cầu Giấy', 'Phường Nghĩa Tân, Quận Cầu Giấy', 'Phường Quan Hoa, Quận Cầu Giấy',
    'Phường Trung Hòa, Quận Cầu Giấy', 'Phường Yên Hòa, Quận Cầu Giấy',

    // Quận Đống Đa
    'Phường Cát Linh, Quận Đống Đa', 'Phường Hàng Bột, Quận Đống Đa', 'Phường Khâm Thiên, Quận Đống Đa',
    'Phường Khương Thượng, Quận Đống Đa', 'Phường Kim Liên, Quận Đống Đa', 'Phường Láng Hạ, Quận Đống Đa',
    'Phường Láng Thượng, Quận Đống Đa', 'Phường Nam Đồng, Quận Đống Đa', 'Phường Ngã Tư Sở, Quận Đống Đa',
    'Phường Ô Chợ Dừa, Quận Đống Đa', 'Phường Phương Liên, Quận Đống Đa', 'Phường Phương Mai, Quận Đống Đa',
    'Phường Quang Trung, Quận Đống Đa', 'Phường Quốc Tử Giám, Quận Đống Đa', 'Phường Thịnh Quang, Quận Đống Đa',
    'Phường Thổ Quan, Quận Đống Đa', 'Phường Trung Liệt, Quận Đống Đa', 'Phường Trung Phụng, Quận Đống Đa',
    'Phường Trung Tự, Quận Đống Đa', 'Phường Văn Chương, Quận Đống Đa', 'Phường Văn Miếu, Quận Đống Đa',

    // Quận Hai Bà Trưng
    'Phường Bạch Đằng, Quận Hai Bà Trưng', 'Phường Bách Khoa, Quận Hai Bà Trưng', 'Phường Bạch Mai, Quận Hai Bà Trưng',
    'Phường Cầu Dền, Quận Hai Bà Trưng', 'Phường Đống Mác, Quận Hai Bà Trưng', 'Phường Đồng Nhân, Quận Hai Bà Trưng',
    'Phường Đồng Tâm, Quận Hai Bà Trưng', 'Phường Lê Đại Hành, Quận Hai Bà Trưng', 'Phường Minh Khai, Quận Hai Bà Trưng',
    'Phường Nguyễn Du, Quận Hai Bà Trưng', 'Phường Phạm Đình Hổ, Quận Hai Bà Trưng', 'Phường Phố Huế, Quận Hai Bà Trưng',
    'Phường Quỳnh Lôi, Quận Hai Bà Trưng', 'Phường Quỳnh Mai, Quận Hai Bà Trưng', 'Phường Thanh Lương, Quận Hai Bà Trưng',
    'Phường Thanh Nhàn, Quận Hai Bà Trưng', 'Phường Trương Định, Quận Hai Bà Trưng', 'Phường Vĩnh Tuy, Quận Hai Bà Trưng',

    // Quận Thanh Xuân
    'Phường Hạ Đình, Quận Thanh Xuân', 'Phường Khương Đình, Quận Thanh Xuân', 'Phường Khương Mai, Quận Thanh Xuân',
    'Phường Khương Trung, Quận Thanh Xuân', 'Phường Kim Giang, Quận Thanh Xuân', 'Phường Nhân Chính, Quận Thanh Xuân',
    'Phường Phương Liệt, Quận Thanh Xuân', 'Phường Thanh Xuân Bắc, Quận Thanh Xuân', 'Phường Thanh Xuân Nam, Quận Thanh Xuân',
    'Phường Thanh Xuân Trung, Quận Thanh Xuân', 'Phường Thượng Đình, Quận Thanh Xuân',

    // Quận Tây Hồ
    'Phường Bưởi, Quận Tây Hồ', 'Phường Nhật Tân, Quận Tây Hồ', 'Phường Phú Thượng, Quận Tây Hồ',
    'Phường Quảng An, Quận Tây Hồ', 'Phường Thụy Khuê, Quận Tây Hồ', 'Phường Tứ Liên, Quận Tây Hồ',
    'Phường Xuân La, Quận Tây Hồ', 'Phường Yên Phụ, Quận Tây Hồ',

    // Quận Hoàng Mai
    'Phường Đại Kim, Quận Hoàng Mai', 'Phường Định Công, Quận Hoàng Mai', 'Phường Giáp Bát, Quận Hoàng Mai',
    'Phường Hoàng Liệt, Quận Hoàng Mai', 'Phường Hoàng Văn Thụ, Quận Hoàng Mai', 'Phường Lĩnh Nam, Quận Hoàng Mai',
    'Phường Mai Động, Quận Hoàng Mai', 'Phường Tân Mai, Quận Hoàng Mai', 'Phường Thanh Trì, Quận Hoàng Mai',
    'Phường Thịnh Liệt, Quận Hoàng Mai', 'Phường Trần Phú, Quận Hoàng Mai', 'Phường Tương Mai, Quận Hoàng Mai',
    'Phường Vĩnh Hưng, Quận Hoàng Mai', 'Phường Yên Sở, Quận Hoàng Mai',

    // Quận Long Biên
    'Phường Bồ Đề, Quận Long Biên', 'Phường Cự Khối, Quận Long Biên', 'Phường Đức Giang, Quận Long Biên',
    'Phường Gia Thụy, Quận Long Biên', 'Phường Giang Biên, Quận Long Biên', 'Phường Long Biên, Quận Long Biên',
    'Phường Ngọc Lâm, Quận Long Biên', 'Phường Ngọc Thụy, Quận Long Biên', 'Phường Phúc Đồng, Quận Long Biên',
    'Phường Phúc Lợi, Quận Long Biên', 'Phường Sài Đồng, Quận Long Biên', 'Phường Thạch Bàn, Quận Long Biên',
    'Phường Thượng Thanh, Quận Long Biên', 'Phường Việt Hưng, Quận Long Biên',

    // Quận Nam Từ Liêm
    'Phường Cầu Diễn, Quận Nam Từ Liêm', 'Phường Đại Mỗ, Quận Nam Từ Liêm', 'Phường Mễ Trì, Quận Nam Từ Liêm',
    'Phường Mỹ Đình 1, Quận Nam Từ Liêm', 'Phường Mỹ Đình 2, Quận Nam Từ Liêm', 'Phường Phú Đô, Quận Nam Từ Liêm',
    'Phường Phương Canh, Quận Nam Từ Liêm', 'Phường Tây Mỗ, Quận Nam Từ Liêm', 'Phường Trung Văn, Quận Nam Từ Liêm',
    'Phường Xuân Phương, Quận Nam Từ Liêm',

    // Quận Bắc Từ Liêm
    'Phường Cổ Nhuế 1, Quận Bắc Từ Liêm', 'Phường Cổ Nhuế 2, Quận Bắc Từ Liêm', 'Phường Đông Ngạc, Quận Bắc Từ Liêm',
    'Phường Đức Thắng, Quận Bắc Từ Liêm', 'Phường Liên Mạc, Quận Bắc Từ Liêm', 'Phường Minh Khai, Quận Bắc Từ Liêm',
    'Phường Phú Diễn, Quận Bắc Từ Liêm', 'Phường Phúc Diễn, Quận Bắc Từ Liêm', 'Phường Tây Tựu, Quận Bắc Từ Liêm',
    'Phường Thượng Cát, Quận Bắc Từ Liêm', 'Phường Thụy Phương, Quận Bắc Từ Liêm', 'Phường Xuân Đỉnh, Quận Bắc Từ Liêm',
    'Phường Xuân Tảo, Quận Bắc Từ Liêm',

    // Quận Hà Đông
    'Phường Biên Giang, Quận Hà Đông', 'Phường Đồng Mai, Quận Hà Đông', 'Phường Dương Nội, Quận Hà Đông',
    'Phường Hà Cầu, Quận Hà Đông', 'Phường Kiến Hưng, Quận Hà Đông', 'Phường La Khê, Quận Hà Đông',
    'Phường Mộ Lao, Quận Hà Đông', 'Phường Nguyễn Trãi, Quận Hà Đông', 'Phường Phú La, Quận Hà Đông',
    'Phường Phú Lãm, Quận Hà Đông', 'Phường Phú Lương, Quận Hà Đông', 'Phường Phúc La, Quận Hà Đông',
    'Phường Quang Trung, Quận Hà Đông', 'Phường Vạn Phúc, Quận Hà Đông', 'Phường Văn Quán, Quận Hà Đông',
    'Phường Yên Nghĩa, Quận Hà Đông', 'Phường Yết Kiêu, Quận Hà Đông'
  ],

  'Đà Nẵng': [
    // Quận Hải Châu
    'Phường Hải Châu 1, Quận Hải Châu', 'Phường Hải Châu 2, Quận Hải Châu', 'Phường Thạch Thang, Quận Hải Châu',
    'Phường Thanh Bình, Quận Hải Châu', 'Phường Thuận Phước, Quận Hải Châu', 'Phường Hòa Thuận Đông, Quận Hải Châu',
    'Phường Hòa Thuận Tây, Quận Hải Châu', 'Phường Nam Dương, Quận Hải Châu', 'Phường Phước Ninh, Quận Hải Châu',
    'Phường Bình Thuận, Quận Hải Châu', 'Phường Bình Hiên, Quận Hải Châu', 'Phường Hòa Cường Bắc, Quận Hải Châu',
    'Phường Hòa Cường Nam, Quận Hải Châu',

    // Quận Thanh Khê
    'Phường Vĩnh Trung, Quận Thanh Khê', 'Phường Tân Chính, Quận Thanh Khê', 'Phường Thạc Gián, Quận Thanh Khê',
    'Phường Chính Gián, Quận Thanh Khê', 'Phường Tam Thuận, Quận Thanh Khê', 'Phường Xuân Hà, Quận Thanh Khê',
    'Phường An Khê, Quận Thanh Khê', 'Phường Hòa Khê, Quận Thanh Khê', 'Phường Thanh Khê Đông, Quận Thanh Khê',
    'Phường Thanh Khê Tây, Quận Thanh Khê',

    // Quận Sơn Trà
    'Phường An Hải Bắc, Quận Sơn Trà', 'Phường An Hải Tây, Quận Sơn Trà', 'Phường An Hải Đông, Quận Sơn Trà',
    'Phường Phước Mỹ, Quận Sơn Trà', 'Phường Nại Hiên Đông, Quận Sơn Trà', 'Phường Mân Thái, Quận Sơn Trà',
    'Phường Thọ Quang, Quận Sơn Trà',

    // Quận Ngũ Hành Sơn
    'Phường Mỹ An, Quận Ngũ Hành Sơn', 'Phường Khuê Mỹ, Quận Ngũ Hành Sơn',
    'Phường Hòa Hải, Quận Ngũ Hành Sơn', 'Phường Hòa Quý, Quận Ngũ Hành Sơn',

    // Quận Cẩm Lệ
    'Phường Khuê Trung, Quận Cẩm Lệ', 'Phường Hòa Thọ Đông, Quận Cẩm Lệ', 'Phường Hòa Thọ Tây, Quận Cẩm Lệ',
    'Phường Hòa An, Quận Cẩm Lệ', 'Phường Hòa Phát, Quận Cẩm Lệ', 'Phường Hòa Xuân, Quận Cẩm Lệ',

    // Quận Liên Chiểu
    'Phường Hòa Khánh Bắc, Quận Liên Chiểu', 'Phường Hòa Khánh Nam, Quận Liên Chiểu', 'Phường Hòa Minh, Quận Liên Chiểu',
    'Phường Hòa Hiệp Bắc, Quận Liên Chiểu', 'Phường Hòa Hiệp Nam, Quận Liên Chiểu',

    // Huyện Hòa Vang
    'Xã Hòa Châu, Huyện Hòa Vang', 'Xã Hòa Tiến, Huyện Hòa Vang', 'Xã Hòa Phước, Huyện Hòa Vang',
    'Xã Hòa Khương, Huyện Hòa Vang', 'Xã Hòa Nhơn, Huyện Hòa Vang', 'Xã Hòa Phong, Huyện Hòa Vang',
    'Xã Hòa Phú, Huyện Hòa Vang', 'Xã Hòa Ninh, Huyện Hòa Vang', 'Xã Hòa Liên, Huyện Hòa Vang',
    'Xã Hòa Sơn, Huyện Hòa Vang', 'Xã Hòa Bắc, Huyện Hòa Vang'
  ],

  'Hải Phòng': [
    'Phường Hoàng Văn Thụ, Quận Hồng Bàng', 'Phường Hạ Lý, Quận Hồng Bàng', 'Phường Thượng Lý, Quận Hồng Bàng',
    'Phường Sở Dầu, Quận Hồng Bàng', 'Phường Quán Toan, Quận Hồng Bàng', 'Phường Hùng Vương, Quận Hồng Bàng',
    'Phường Máy Tơ, Quận Ngô Quyền', 'Phường Cầu Đất, Quận Ngô Quyền', 'Phường Lạch Tray, Quận Ngô Quyền',
    'Phường Đông Khê, Quận Ngô Quyền', 'Phường Đằng Giang, Quận Ngô Quyền', 'Phường Vạn Mỹ, Quận Ngô Quyền',
    'Phường Cát Dài, Quận Lê Chân', 'Phường An Dương, Quận Lê Chân', 'Phường Vĩnh Niệm, Quận Lê Chân',
    'Phường Dư Hàng Kênh, Quận Lê Chân', 'Phường Kênh Dương, Quận Lê Chân', 'Phường Lam Sơn, Quận Lê Chân',
    'Phường Đằng Hải, Quận Hải An', 'Phường Đông Hải 1, Quận Hải An', 'Phường Đông Hải 2, Quận Hải An',
    'Phường Nam Hải, Quận Hải An', 'Phường Tràng Cát, Quận Hải An', 'Phường Thành Tô, Quận Hải An',
    'Phường Trần Thành Ngọ, Quận Kiến An', 'Phường Bắc Sơn, Quận Kiến An', 'Phường Quán Trữ, Quận Kiến An',
    'Phường Vạn Hương, Quận Đồ Sơn', 'Phường Ngọc Xuyên, Quận Đồ Sơn', 'Phường Hợp Đức, Quận Đồ Sơn',
    'Phường Anh Dũng, Quận Dương Kinh', 'Phường Hải Thành, Quận Dương Kinh', 'Phường Hòa Nghĩa, Quận Dương Kinh',
    'Thị trấn Núi Đèo, TP. Thủy Nguyên', 'Xã Thủy Đường, TP. Thủy Nguyên', 'Xã Tân Dương, TP. Thủy Nguyên'
  ],

  'Cần Thơ': [
    'Phường An Phú, Quận Ninh Kiều', 'Phường Xuân Khánh, Quận Ninh Kiều', 'Phường Tân An, Quận Ninh Kiều',
    'Phường Cái Khế, Quận Ninh Kiều', 'Phường An Khánh, Quận Ninh Kiều', 'Phường Hưng Lợi, Quận Ninh Kiều',
    'Phường An Hòa, Quận Ninh Kiều', 'Phường An Cư, Quận Ninh Kiều', 'Phường Thới Bình, Quận Ninh Kiều',
    'Phường Hưng Phú, Quận Cái Răng', 'Phường Lê Bình, Quận Cái Răng', 'Phường Ba Láng, Quận Cái Răng',
    'Phường Hưng Thạnh, Quận Cái Răng', 'Phường Phú Thứ, Quận Cái Răng', 'Phường Tân Phú, Quận Cái Răng',
    'Phường Bình Thủy, Quận Bình Thủy', 'Phường An Thới, Quận Bình Thủy', 'Phường Trà Nóc, Quận Bình Thủy',
    'Phường Long Hòa, Quận Bình Thủy', 'Phường Long Tuyền, Quận Bình Thủy', 'Phường Thới An Đông, Quận Bình Thủy',
    'Phường Châu Văn Liêm, Quận Ô Môn', 'Phường Phước Thới, Quận Ô Môn', 'Phường Thới An, Quận Ô Môn',
    'Phường Thốt Nốt, Quận Thốt Nốt', 'Phường Thuận An, Quận Thốt Nốt', 'Phường Thới Thuận, Quận Thốt Nốt'
  ],

  'Bình Dương': [
    // TP. Thủ Dầu Một
    'Phường Phú Cường, TP. Thủ Dầu Một', 'Phường Hiệp Thành, TP. Thủ Dầu Một', 'Phường Phú Hòa, TP. Thủ Dầu Một',
    'Phường Phú Thọ, TP. Thủ Dầu Một', 'Phường Chánh Nghĩa, TP. Thủ Dầu Một', 'Phường Phú Mỹ, TP. Thủ Dầu Một',
    'Phường Định Hòa, TP. Thủ Dầu Một', 'Phường Hòa Phú, TP. Thủ Dầu Một', 'Phường Phú Tân, TP. Thủ Dầu Một',
    'Phường Tân An, TP. Thủ Dầu Một', 'Phường Hiệp An, TP. Thủ Dầu Một', 'Phường Tương Bình Hiệp, TP. Thủ Dầu Một',
    // TP. Thuận An
    'Phường Lái Thiêu, TP. Thuận An', 'Phường An Phú, TP. Thuận An', 'Phường Bình Chuẩn, TP. Thuận An',
    'Phường Bình Hòa, TP. Thuận An', 'Phường Thuận Giao, TP. Thuận An', 'Phường An Thạnh, TP. Thuận An',
    'Phường Vĩnh Phú, TP. Thuận An', 'Phường Hưng Định, TP. Thuận An', 'Phường Bình Nhâm, TP. Thuận An',
    // TP. Dĩ An
    'Phường Dĩ An, TP. Dĩ An', 'Phường Tân Bình, TP. Dĩ An', 'Phường Đông Hòa, TP. Dĩ An',
    'Phường An Bình, TP. Dĩ An', 'Phường Bình An, TP. Dĩ An', 'Phường Bình Thắng, TP. Dĩ An',
    'Phường Tân Đông Hiệp, TP. Dĩ An',
    // TP. Tân Uyên
    'Phường Uyên Hưng, TP. Tân Uyên', 'Phường Tân Phước Khánh, TP. Tân Uyên', 'Phường Thái Hòa, TP. Tân Uyên',
    'Phường Thạnh Phước, TP. Tân Uyên', 'Phường Tân Hiệp, TP. Tân Uyên', 'Phường Khánh Bình, TP. Tân Uyên',
    'Phường Hội Nghĩa, TP. Tân Uyên', 'Phường Phú Chánh, TP. Tân Uyên', 'Phường Vĩnh Tân, TP. Tân Uyên',
    // TP. Bến Cát
    'Phường Mỹ Phước, TP. Bến Cát', 'Phường Thới Hòa, TP. Bến Cát', 'Phường Tân Định, TP. Bến Cát',
    'Phường Hòa Lợi, TP. Bến Cát', 'Phường Chánh Phú Hòa, TP. Bến Cát', 'Phường An Điền, TP. Bến Cát',
    'Phường An Tây, TP. Bến Cát'
  ],

  'Đồng Nai': [
    // TP. Biên Hòa
    'Phường Quyết Thắng, TP. Biên Hòa', 'Phường Tân Tiến, TP. Biên Hòa', 'Phường Thống Nhất, TP. Biên Hòa',
    'Phường Long Bình, TP. Biên Hòa', 'Phường Long Bình Tân, TP. Biên Hòa', 'Phường Trảng Dài, TP. Biên Hòa',
    'Phường Tân Phong, TP. Biên Hòa', 'Phường Hố Nai, TP. Biên Hòa', 'Phường Tân Hòa, TP. Biên Hòa',
    'Phường Tân Biên, TP. Biên Hòa', 'Phường Tam Hiệp, TP. Biên Hòa', 'Phường Tam Hòa, TP. Biên Hòa',
    'Phường Bửu Long, TP. Biên Hòa', 'Phường Quang Vinh, TP. Biên Hòa', 'Phường Trung Dũng, TP. Biên Hòa',
    'Phường An Bình, TP. Biên Hòa', 'Phường Hiệp Hòa, TP. Biên Hòa', 'Phường Hóa An, TP. Biên Hòa',
    'Phường Phước Tân, TP. Biên Hòa', 'Phường Tam Phước, TP. Biên Hòa',
    // TP. Long Khánh
    'Phường Xuân An, TP. Long Khánh', 'Phường Xuân Bình, TP. Long Khánh', 'Phường Xuân Hòa, TP. Long Khánh',
    'Phường Xuân Trung, TP. Long Khánh', 'Phường Phú Bình, TP. Long Khánh', 'Phường Suối Tre, TP. Long Khánh',
    // Huyện Long Thành
    'Thị trấn Long Thành, Huyện Long Thành', 'Xã An Phước, Huyện Long Thành', 'Xã Bình Sơn, Huyện Long Thành',
    'Xã Lộc An, Huyện Long Thành', 'Xã Long Đức, Huyện Long Thành', 'Xã Tam An, Huyện Long Thành',
    // Huyện Nhơn Trạch
    'Xã Hiệp Phước, Huyện Nhơn Trạch', 'Xã Đại Phước, Huyện Nhơn Trạch', 'Xã Phú Hữu, Huyện Nhơn Trạch',
    'Xã Phước Thiền, Huyện Nhơn Trạch', 'Xã Phú Hội, Huyện Nhơn Trạch'
  ],

  'Bà Rịa - Vũng Tàu': [
    'Phường 1, TP. Vũng Tàu', 'Phường 2, TP. Vũng Tàu', 'Phường 3, TP. Vũng Tàu', 'Phường 4, TP. Vũng Tàu',
    'Phường 5, TP. Vũng Tàu', 'Phường 7, TP. Vũng Tàu', 'Phường 8, TP. Vũng Tàu', 'Phường 9, TP. Vũng Tàu',
    'Phường 10, TP. Vũng Tàu', 'Phường 11, TP. Vũng Tàu', 'Phường 12, TP. Vũng Tàu',
    'Phường Thắng Tam, TP. Vũng Tàu', 'Phường Thắng Nhất, TP. Vũng Tàu', 'Phường Thắng Nhì, TP. Vũng Tàu',
    'Phường Nguyễn An Ninh, TP. Vũng Tàu', 'Phường Rạch Dừa, TP. Vũng Tàu',
    'Phường Phước Trung, TP. Bà Rịa', 'Phường Phước Hiệp, TP. Bà Rịa', 'Phường Long Toàn, TP. Bà Rịa',
    'Phường Long Tâm, TP. Bà Rịa', 'Phường Kim Dinh, TP. Bà Rịa',
    'Phường Phú Mỹ, TX. Phú Mỹ', 'Phường Hắc Dịch, TX. Phú Mỹ', 'Phường Mỹ Xuân, TX. Phú Mỹ',
    'Phường Phước Hòa, TX. Phú Mỹ', 'Phường Tân Phước, TX. Phú Mỹ'
  ],

  'Khánh Hòa': [
    'Phường Lộc Thọ, TP. Nha Trang', 'Phường Vĩnh Nguyên, TP. Nha Trang', 'Phường Phước Tân, TP. Nha Trang',
    'Phường Vĩnh Hải, TP. Nha Trang', 'Phường Vĩnh Phước, TP. Nha Trang', 'Phường Phước Hải, TP. Nha Trang',
    'Phường Tân Lập, TP. Nha Trang', 'Phường Phương Sài, TP. Nha Trang', 'Phường Ngọc Hiệp, TP. Nha Trang',
    'Phường Vạn Thạnh, TP. Nha Trang', 'Phường Vạn Thắng, TP. Nha Trang', 'Phường Phước Long, TP. Nha Trang',
    'Phường Cam Ranh, TP. Cam Ranh', 'Phường Cam Lộc, TP. Cam Ranh', 'Phường Cam Phú, TP. Cam Ranh',
    'Phường Ninh Hiệp, TX. Ninh Hòa', 'Phường Ninh Giang, TX. Ninh Hòa'
  ],

  'Lâm Đồng': [
    'Phường 1, TP. Đà Lạt', 'Phường 2, TP. Đà Lạt', 'Phường 3, TP. Đà Lạt', 'Phường 4, TP. Đà Lạt',
    'Phường 5, TP. Đà Lạt', 'Phường 6, TP. Đà Lạt', 'Phường 7, TP. Đà Lạt', 'Phường 8, TP. Đà Lạt',
    'Phường 9, TP. Đà Lạt', 'Phường 10, TP. Đà Lạt', 'Phường 11, TP. Đà Lạt', 'Phường 12, TP. Đà Lạt',
    'Phường 1, TP. Bảo Lộc', 'Phường 2, TP. Bảo Lộc', 'Phường B\'Lao, TP. Bảo Lộc',
    'Phường Lộc Phát, TP. Bảo Lộc', 'Phường Lộc Sơn, TP. Bảo Lộc', 'Phường Lộc Tiến, TP. Bảo Lộc'
  ],

  'Quảng Ninh': [
    'Phường Bãi Cháy, TP. Hạ Long', 'Phường Bạch Đằng, TP. Hạ Long', 'Phường Hồng Gai, TP. Hạ Long',
    'Phường Hồng Hà, TP. Hạ Long', 'Phường Hồng Hải, TP. Hạ Long', 'Phường Cao Xanh, TP. Hạ Long',
    'Phường Cao Thắng, TP. Hạ Long', 'Phường Hùng Thắng, TP. Hạ Long', 'Phường Tuần Châu, TP. Hạ Long',
    'Phường Cẩm Trung, TP. Cẩm Phả', 'Phường Cẩm Thành, TP. Cẩm Phả', 'Phường Quang Hanh, TP. Cẩm Phả',
    'Phường Quang Trung, TP. Uông Bí', 'Phường Thanh Sơn, TP. Uông Bí', 'Phường Ka Long, TP. Móng Cái',
    'Phường Trần Phú, TP. Móng Cái', 'Phường Quảng Yên, TX. Quảng Yên', 'Phường Mạo Khê, TX. Đông Triều'
  ],

  'Thừa Thiên Huế': [
    'Phường Phú Nhuận, TP. Huế', 'Phường Vĩnh Ninh, TP. Huế', 'Phường Thuận Thành, TP. Huế',
    'Phường Thuận Hòa, TP. Huế', 'Phường Phú Hòa, TP. Huế', 'Phường Tây Lộc, TP. Huế',
    'Phường Kim Long, TP. Huế', 'Phường An Đông, TP. Huế', 'Phường An Cựu, TP. Huế',
    'Phường Vỹ Dạ, TP. Huế', 'Phường Xuân Phú, TP. Huế', 'Phường Thủy Xuân, TP. Huế',
    'Phường Hương Sơ, TP. Huế', 'Phường Tứ Hạ, TX. Hương Trà', 'Phường Phú Bài, TX. Hương Thủy'
  ],

  'Bắc Ninh': [
    'Phường Suối Hoa, TP. Bắc Ninh', 'Phường Tiền An, TP. Bắc Ninh', 'Phường Ninh Xá, TP. Bắc Ninh',
    'Phường Đại Phúc, TP. Bắc Ninh', 'Phường Đáp Cầu, TP. Bắc Ninh', 'Phường Thị Cầu, TP. Bắc Ninh',
    'Phường Kinh Bắc, TP. Bắc Ninh', 'Phường Vũ Ninh, TP. Bắc Ninh', 'Phường Võ Cường, TP. Bắc Ninh',
    'Phường Vân Dương, TP. Bắc Ninh', 'Phường Hạp Lĩnh, TP. Bắc Ninh',
    'Phường Đông Ngàn, TP. Từ Sơn', 'Phường Đồng Nguyên, TP. Từ Sơn', 'Phường Trang Hạ, TP. Từ Sơn',
    'Phường Hồ, TX. Thuận Thành', 'Phường Phố Mới, TX. Quế Võ'
  ],

  'Kiên Giang': [
    'Phường Vĩnh Thanh Vân, TP. Rạch Giá', 'Phường Vĩnh Lạc, TP. Rạch Giá', 'Phường Vĩnh Bảo, TP. Rạch Giá',
    'Phường An Hòa, TP. Rạch Giá', 'Phường Rạch Sỏi, TP. Rạch Giá', 'Phường Vĩnh Quang, TP. Rạch Giá',
    'Phường Dương Đông, TP. Phú Quốc', 'Phường An Thới, TP. Phú Quốc', 'Xã Cửa Dương, TP. Phú Quốc',
    'Xã Cửa Cạn, TP. Phú Quốc', 'Xã Dương Tơ, TP. Phú Quốc', 'Xã Hàm Ninh, TP. Phú Quốc',
    'Phường Pháo Đài, TP. Hà Tiên', 'Phường Bình San, TP. Hà Tiên'
  ],

  'Nghệ An': [
    'Phường Trường Thi, TP. Vinh', 'Phường Lê Lợi, TP. Vinh', 'Phường Quang Trung, TP. Vinh',
    'Phường Bến Thủy, TP. Vinh', 'Phường Cửa Nam, TP. Vinh', 'Phường Đội Cung, TP. Vinh',
    'Phường Đông Vĩnh, TP. Vinh', 'Phường Hà Huy Tập, TP. Vinh', 'Phường Hưng Bình, TP. Vinh',
    'Phường Hưng Dũng, TP. Vinh', 'Phường Hưng Phúc, TP. Vinh', 'Phường Quán Bàu, TP. Vinh',
    'Phường Trung Đô, TP. Vinh', 'Phường Nghi Hương, TX. Cửa Lò', 'Phường Thu Thủy, TX. Cửa Lò'
  ],

  'Thanh Hóa': [
    'Phường Điện Biên, TP. Thanh Hóa', 'Phường Ba Đình, TP. Thanh Hóa', 'Phường Lam Sơn, TP. Thanh Hóa',
    'Phường Ngọc Trạo, TP. Thanh Hóa', 'Phường Đông Thọ, TP. Thanh Hóa', 'Phường Đông Vệ, TP. Thanh Hóa',
    'Phường Đông Hương, TP. Thanh Hóa', 'Phường Đông Hải, TP. Thanh Hóa', 'Phường Hàm Rồng, TP. Thanh Hóa',
    'Phường Phú Sơn, TP. Thanh Hóa', 'Phường Quảng Hưng, TP. Thanh Hóa', 'Phường Quảng Thành, TP. Thanh Hóa',
    'Phường Bắc Sơn, TP. Sầm Sơn', 'Phường Trường Sơn, TP. Sầm Sơn', 'Phường Ba Đình, TX. Bỉm Sơn'
  ],

  'Tiền Giang': [
    'Phường 1, TP. Mỹ Tho', 'Phường 2, TP. Mỹ Tho', 'Phường 3, TP. Mỹ Tho', 'Phường 4, TP. Mỹ Tho',
    'Phường 5, TP. Mỹ Tho', 'Phường 6, TP. Mỹ Tho', 'Phường 7, TP. Mỹ Tho', 'Phường 8, TP. Mỹ Tho',
    'Phường 9, TP. Mỹ Tho', 'Phường 10, TP. Mỹ Tho', 'Phường Tân Long, TP. Mỹ Tho',
    'Phường 1, TX. Gò Công', 'Phường 2, TX. Gò Công', 'Phường 1, TX. Cai Lậy'
  ],

  'An Giang': [
    'Phường Mỹ Long, TP. Long Xuyên', 'Phường Mỹ Bình, TP. Long Xuyên', 'Phường Mỹ Xuyên, TP. Long Xuyên',
    'Phường Mỹ Phước, TP. Long Xuyên', 'Phường Mỹ Quý, TP. Long Xuyên', 'Phường Mỹ Thới, TP. Long Xuyên',
    'Phường Bình Đức, TP. Long Xuyên', 'Phường Bình Khánh, TP. Long Xuyên', 'Phường Đông Xuyên, TP. Long Xuyên',
    'Phường Châu Phú A, TP. Châu Đốc', 'Phường Châu Phú B, TP. Châu Đốc', 'Phường Núi Sam, TP. Châu Đốc',
    'Phường Long Thạnh, TX. Tân Châu', 'Phường Chi Lăng, TX. Tịnh Biên'
  ],

  'Bình Phước': [
    'Phường Tân Bình, TP. Đồng Xoài', 'Phường Tân Phú, TP. Đồng Xoài', 'Phường Tân Xuân, TP. Đồng Xoài',
    'Phường Tân Thiện, TP. Đồng Xoài', 'Phường Tân Đồng, TP. Đồng Xoài', 'Phường An Lộc, TX. Bình Long',
    'Phường Phước Bình, TX. Phước Long', 'Phường Long Phước, TX. Phước Long', 'Phường Hưng Chiến, TX. Chơn Thành'
  ],

  'Tây Ninh': [
    'Phường 1, TP. Tây Ninh', 'Phường 2, TP. Tây Ninh', 'Phường 3, TP. Tây Ninh', 'Phường 4, TP. Tây Ninh',
    'Phường Hiệp Ninh, TP. Tây Ninh', 'Phường Ninh Sơn, TP. Tây Ninh', 'Phường Ninh Thạnh, TP. Tây Ninh',
    'Phường Long Hoa, TX. Hòa Thành', 'Phường Long Thành Trung, TX. Hòa Thành', 'Phường Trảng Bàng, TX. Trảng Bàng'
  ],

  'Long An': [
    'Phường 1, TP. Tân An', 'Phường 2, TP. Tân An', 'Phường 3, TP. Tân An', 'Phường 4, TP. Tân An',
    'Phường 5, TP. Tân An', 'Phường 6, TP. Tân An', 'Phường 7, TP. Tân An', 'Phường Khánh Hậu, TP. Tân An',
    'Phường Tân Khánh, TP. Tân An', 'Phường 1, TX. Kiến Tường', 'Phường 2, TX. Kiến Tường',
    'Thị trấn Bến Lức, Huyện Bến Lức', 'Thị trấn Cần Giuộc, Huyện Cần Giuộc', 'Thị trấn Đức Hòa, Huyện Đức Hòa'
  ],

  'Bến Tre': [
    'Phường An Hội, TP. Bến Tre', 'Phường Phú Khương, TP. Bến Tre', 'Phường Phú Tân, TP. Bến Tre',
    'Phường 4, TP. Bến Tre', 'Phường 5, TP. Bến Tre', 'Phường 6, TP. Bến Tre', 'Phường 7, TP. Bến Tre',
    'Phường 8, TP. Bến Tre', 'Thị trấn Ba Tri, Huyện Ba Tri', 'Thị trấn Châu Thành, Huyện Châu Thành'
  ],

  'Đắk Lắk': [
    'Phường Thắng Lợi, TP. Buôn Ma Thuột', 'Phường Tân Lợi, TP. Buôn Ma Thuột', 'Phường Tân An, TP. Buôn Ma Thuột',
    'Phường Tự An, TP. Buôn Ma Thuột', 'Phường Tân Lập, TP. Buôn Ma Thuột', 'Phường Tân Hòa, TP. Buôn Ma Thuột',
    'Phường Thành Công, TP. Buôn Ma Thuột', 'Phường Thành Nhất, TP. Buôn Ma Thuột', 'Phường Ea Tam, TP. Buôn Ma Thuột',
    'Phường An Lạc, TX. Buôn Hồ', 'Phường Thiện An, TX. Buôn Hồ'
  ],

  'Gia Lai': [
    'Phường Tây Sơn, TP. Pleiku', 'Phường Hoa Lư, TP. Pleiku', 'Phường Diên Hồng, TP. Pleiku',
    'Phường Ia Kring, TP. Pleiku', 'Phường Hội Thương, TP. Pleiku', 'Phường Hội Phú, TP. Pleiku',
    'Phường Thắng Lợi, TP. Pleiku', 'Phường Phù Đổng, TP. Pleiku', 'Phường Đoàn Kết, TX. Ayun Pa',
    'Phường An Bình, TX. An Khê'
  ],

  'Bình Thuận': [
    'Phường Đức Nghĩa, TP. Phan Thiết', 'Phường Đức Thắng, TP. Phan Thiết', 'Phường Lạc Đạo, TP. Phan Thiết',
    'Phường Phú Thủy, TP. Phan Thiết', 'Phường Phú Trinh, TP. Phan Thiết', 'Phường Xuân An, TP. Phan Thiết',
    'Phường Hàm Tiến, TP. Phan Thiết', 'Phường Mũi Né, TP. Phan Thiết', 'Phường Phước Hội, TX. La Gi'
  ],

  'Bình Định': [
    'Phường Lê Lợi, TP. Quy Nhơn', 'Phường Trần Phú, TP. Quy Nhơn', 'Phường Ngô Mây, TP. Quy Nhơn',
    'Phường Nguyễn Văn Cừ, TP. Quy Nhơn', 'Phường Quang Trung, TP. Quy Nhơn', 'Phường Ghềnh Ráng, TP. Quy Nhơn',
    'Phường Đống Đa, TP. Quy Nhơn', 'Phường Bình Định, TX. An Nhơn', 'Phường Tam Quan, TX. Hoài Nhơn'
  ],

  'Thái Nguyên': [
    'Phường Phan Đình Phùng, TP. Thái Nguyên', 'Phường Trưng Vương, TP. Thái Nguyên', 'Phường Hoàng Văn Thụ, TP. Thái Nguyên',
    'Phường Quang Trung, TP. Thái Nguyên', 'Phường Tân Lập, TP. Thái Nguyên', 'Phường Ba Hàng, TP. Phổ Yên',
    'Phường Thắng Lợi, TP. Sông Công'
  ],

  'Bắc Giang': [
    'Phường Ngô Quyền, TP. Bắc Giang', 'Phường Trần Phú, TP. Bắc Giang', 'Phường Lê Lợi, TP. Bắc Giang',
    'Phường Hoàng Văn Thụ, TP. Bắc Giang', 'Phường Dĩnh Kế, TP. Bắc Giang', 'Phường Bích Động, TX. Việt Yên'
  ],

  'Vĩnh Phúc': [
    'Phường Tích Sơn, TP. Vĩnh Yên', 'Phường Liên Bảo, TP. Vĩnh Yên', 'Phường Ngô Quyền, TP. Vĩnh Yên',
    'Phường Đống Đa, TP. Vĩnh Yên', 'Phường Trưng Nhị, TP. Phúc Yên', 'Phường Hùng Vương, TP. Phúc Yên'
  ],

  'Phú Thọ': [
    'Phường Gia Cẩm, TP. Việt Trì', 'Phường Tiên Cát, TP. Việt Trì', 'Phường Nông Trang, TP. Việt Trì',
    'Phường Tân Dân, TP. Việt Trì', 'Phường Âu Cơ, TX. Phú Thọ', 'Phường Hùng Vương, TX. Phú Thọ'
  ],

  'Nam Định': [
    'Phường Trần Hưng Đạo, TP. Nam Định', 'Phường Quang Trung, TP. Nam Định', 'Phường Vị Xuyên, TP. Nam Định',
    'Phường Cửa Bắc, TP. Nam Định', 'Phường Lộc Vượng, TP. Nam Định', 'Phường Năng Tĩnh, TP. Nam Định'
  ],

  'Ninh Bình': [
    'Phường Vân Giang, TP. Ninh Bình', 'Phường Thanh Bình, TP. Ninh Bình', 'Phường Nam Bình, TP. Ninh Bình',
    'Phường Bích Đào, TP. Ninh Bình', 'Phường Bắc Sơn, TP. Tam Điệp', 'Phường Trung Sơn, TP. Tam Điệp'
  ],

  'Thái Bình': [
    'Phường Lê Hồng Phong, TP. Thái Bình', 'Phường Bồ Xuyên, TP. Thái Bình', 'Phường Đề Thám, TP. Thái Bình',
    'Phường Kỳ Bá, TP. Thái Bình', 'Phường Trần Lãm, TP. Thái Bình', 'Phường Tiền Phong, TP. Thái Bình'
  ],

  'Hải Dương': [
    'Phường Trần Phú, TP. Hải Dương', 'Phường Quang Trung, TP. Hải Dương', 'Phường Nguyễn Trãi, TP. Hải Dương',
    'Phường Lê Thanh Nghị, TP. Hải Dương', 'Phường Hải Tân, TP. Hải Dương', 'Phường Sao Đỏ, TP. Chí Linh'
  ],

  'Hưng Yên': [
    'Phường Lê Lợi, TP. Hưng Yên', 'Phường Quang Trung, TP. Hưng Yên', 'Phường Minh Khai, TP. Hưng Yên',
    'Phường Hiến Nam, TP. Hưng Yên', 'Phường Bần Yên Nhân, TX. Mỹ Hào', 'Phường Bạch Sam, TX. Mỹ Hào'
  ],

  'Hà Nam': [
    'Phường Minh Khai, TP. Phủ Lý', 'Phường Lương Khánh Thiện, TP. Phủ Lý', 'Phường Hai Bà Trưng, TP. Phủ Lý',
    'Phường Trần Hưng Đạo, TP. Phủ Lý', 'Phường Châu Sơn, TP. Phủ Lý', 'Phường Đồng Văn, TX. Duy Tiên'
  ],

  'Hà Tĩnh': [
    'Phường Bắc Hà, TP. Hà Tĩnh', 'Phường Nam Hà, TP. Hà Tĩnh', 'Phường Trần Phú, TP. Hà Tĩnh',
    'Phường Hà Huy Tập, TP. Hà Tĩnh', 'Phường Bắc Hồng, TX. Hồng Lĩnh', 'Phường Sông Trí, TX. Kỳ Anh'
  ],

  'Quảng Bình': [
    'Phường Đồng Mỹ, TP. Đồng Hới', 'Phường Hải Đình, TP. Đồng Hới', 'Phường Đồng Phú, TP. Đồng Hới',
    'Phường Bắc Lý, TP. Đồng Hới', 'Phường Nam Lý, TP. Đồng Hới', 'Phường Ba Đồn, TX. Ba Đồn'
  ],

  'Quảng Trị': [
    'Phường 1, TP. Đông Hà', 'Phường 2, TP. Đông Hà', 'Phường 3, TP. Đông Hà', 'Phường 5, TP. Đông Hà',
    'Phường Đông Lương, TP. Đông Hà', 'Phường 1, TX. Quảng Trị', 'Phường 2, TX. Quảng Trị'
  ],

  'Quảng Nam': [
    'Phường An Mỹ, TP. Tam Kỳ', 'Phường An Xuân, TP. Tam Kỳ', 'Phường Tân Thạnh, TP. Tam Kỳ',
    'Phường Phước Hòa, TP. Tam Kỳ', 'Phường Minh An, TP. Hội An', 'Phường Cẩm Phô, TP. Hội An',
    'Phường Sơn Phong, TP. Hội An', 'Phường Điện Ngọc, TX. Điện Bàn', 'Phường Vĩnh Điện, TX. Điện Bàn'
  ],

  'Quảng Ngãi': [
    'Phường Trần Phú, TP. Quảng Ngãi', 'Phường Lê Hồng Phong, TP. Quảng Ngãi', 'Phường Nguyễn Nghiêm, TP. Quảng Ngãi',
    'Phường Chánh Lộ, TP. Quảng Ngãi', 'Phường Nghĩa Chánh, TP. Quảng Ngãi', 'Phường Phổ Thạnh, TX. Đức Phổ'
  ],

  'Phú Yên': [
    'Phường 1, TP. Tuy Hòa', 'Phường 2, TP. Tuy Hòa', 'Phường 3, TP. Tuy Hòa', 'Phường 4, TP. Tuy Hòa',
    'Phường 5, TP. Tuy Hòa', 'Phường 7, TP. Tuy Hòa', 'Phường Phú Lâm, TP. Tuy Hòa',
    'Phường Xuân Yên, TX. Sông Cầu', 'Phường Hòa Vinh, TX. Đông Hòa'
  ],

  'Ninh Thuận': [
    'Phường Phan Rang, TP. Phan Rang - Tháp Chàm', 'Phường Kinh Dinh, TP. Phan Rang - Tháp Chàm',
    'Phường Thanh Sơn, TP. Phan Rang - Tháp Chàm', 'Phường Phước Mỹ, TP. Phan Rang - Tháp Chàm',
    'Phường Đô Vinh, TP. Phan Rang - Tháp Chàm', 'Phường Mỹ Đông, TP. Phan Rang - Tháp Chàm'
  ],

  'Vĩnh Long': [
    'Phường 1, TP. Vĩnh Long', 'Phường 2, TP. Vĩnh Long', 'Phường 3, TP. Vĩnh Long',
    'Phường 4, TP. Vĩnh Long', 'Phường 8, TP. Vĩnh Long', 'Phường 9, TP. Vĩnh Long',
    'Phường Cái Vồn, TX. Bình Minh', 'Phường Đông Thuận, TX. Bình Minh'
  ],

  'Trà Vinh': [
    'Phường 1, TP. Trà Vinh', 'Phường 2, TP. Trà Vinh', 'Phường 3, TP. Trà Vinh',
    'Phường 4, TP. Trà Vinh', 'Phường 5, TP. Trà Vinh', 'Phường 6, TP. Trà Vinh',
    'Phường 1, TX. Duyên Hải', 'Phường 2, TX. Duyên Hải'
  ],

  'Hậu Giang': [
    'Phường 1, TP. Vị Thanh', 'Phường 3, TP. Vị Thanh', 'Phường 4, TP. Vị Thanh',
    'Phường 5, TP. Vị Thanh', 'Phường Thuận An, TP. Ngã Bảy', 'Phường Lái Hiếu, TP. Ngã Bảy',
    'Phường Vĩnh Tường, TX. Long Mỹ'
  ],

  'Sóc Trăng': [
    'Phường 1, TP. Sóc Trăng', 'Phường 2, TP. Sóc Trăng', 'Phường 3, TP. Sóc Trăng',
    'Phường 4, TP. Sóc Trăng', 'Phường 6, TP. Sóc Trăng', 'Phường 8, TP. Sóc Trăng',
    'Phường 1, TX. Vĩnh Châu', 'Phường 1, TX. Ngã Năm'
  ],

  'Bạc Liêu': [
    'Phường 1, TP. Bạc Liêu', 'Phường 2, TP. Bạc Liêu', 'Phường 3, TP. Bạc Liêu',
    'Phường 5, TP. Bạc Liêu', 'Phường 7, TP. Bạc Liêu', 'Phường 8, TP. Bạc Liêu',
    'Phường 1, TX. Giá Rai', 'Phường Hộ Phòng, TX. Giá Rai'
  ],

  'Cà Mau': [
    'Phường 1, TP. Cà Mau', 'Phường 2, TP. Cà Mau', 'Phường 4, TP. Cà Mau',
    'Phường 5, TP. Cà Mau', 'Phường 6, TP. Cà Mau', 'Phường 7, TP. Cà Mau',
    'Phường 8, TP. Cà Mau', 'Phường 9, TP. Cà Mau', 'Phường Tân Thành, TP. Cà Mau'
  ],

  'Đồng Tháp': [
    'Phường 1, TP. Cao Lãnh', 'Phường 2, TP. Cao Lãnh', 'Phường 3, TP. Cao Lãnh',
    'Phường 4, TP. Cao Lãnh', 'Phường Hòa Thuận, TP. Cao Lãnh', 'Phường Mỹ Phú, TP. Cao Lãnh',
    'Phường 1, TP. Sa Đéc', 'Phường 2, TP. Sa Đéc', 'Phường An Lộc, TP. Hồng Ngự'
  ],

  'Kon Tum': [
    'Phường Quyết Thắng, TP. Kon Tum', 'Phường Thắng Lợi, TP. Kon Tum', 'Phường Quang Trung, TP. Kon Tum',
    'Phường Duy Tân, TP. Kon Tum', 'Phường Trần Hưng Đạo, TP. Kon Tum'
  ],

  'Đắk Nông': [
    'Phường Nghĩa Đức, TP. Gia Nghĩa', 'Phường Nghĩa Thành, TP. Gia Nghĩa', 'Phường Nghĩa Phú, TP. Gia Nghĩa',
    'Phường Nghĩa Tân, TP. Gia Nghĩa', 'Phường Nghĩa Trung, TP. Gia Nghĩa'
  ],

  'Lạng Sơn': [
    'Phường Vĩnh Trại, TP. Lạng Sơn', 'Phường Hoàng Văn Thụ, TP. Lạng Sơn', 'Phường Tam Thanh, TP. Lạng Sơn',
    'Phường Đông Kinh, TP. Lạng Sơn', 'Phường Chi Lăng, TP. Lạng Sơn'
  ],

  'Lào Cai': [
    'Phường Kim Tân, TP. Lào Cai', 'Phường Cốc Lếu, TP. Lào Cai', 'Phường Bắc Cường, TP. Lào Cai',
    'Phường Nam Cường, TP. Lào Cai', 'Phường Sa Pa, TX. Sa Pa', 'Phường Hàm Rồng, TX. Sa Pa'
  ],

  'Sơn La': [
    'Phường Quyết Thắng, TP. Sơn La', 'Phường Tô Hiệu, TP. Sơn La', 'Phường Chiềng Lề, TP. Sơn La',
    'Phường Chiềng Cơi, TP. Sơn La', 'Phường Chiềng Sinh, TP. Sơn La', 'Phường Chiềng An, TP. Sơn La'
  ],

  'Hòa Bình': [
    'Phường Phương Lâm, TP. Hòa Bình', 'Phường Đồng Tiến, TP. Hòa Bình', 'Phường Tân Thịnh, TP. Hòa Bình',
    'Phường Thịnh Lang, TP. Hòa Bình', 'Phường Hữu Nghị, TP. Hòa Bình'
  ],

  'Điện Biên': [
    'Phường Mường Thanh, TP. Điện Biên Phủ', 'Phường Tân Thanh, TP. Điện Biên Phủ', 'Phường Thanh Bình, TP. Điện Biên Phủ',
    'Phường Nam Thanh, TP. Điện Biên Phủ', 'Phường Sông Đà, TX. Mường Lay'
  ],

  'Lai Châu': [
    'Phường Quyết Thắng, TP. Lai Châu', 'Phường Tân Phong, TP. Lai Châu', 'Phường Đoàn Kết, TP. Lai Châu',
    'Phường Đông Phong, TP. Lai Châu'
  ],

  'Yên Bái': [
    'Phường Đồng Tâm, TP. Yên Bái', 'Phường Yên Ninh, TP. Yên Bái', 'Phường Minh Tân, TP. Yên Bái',
    'Phường Nguyễn Thái Học, TP. Yên Bái', 'Phường Trung Tâm, TX. Nghĩa Lộ'
  ],

  'Tuyên Quang': [
    'Phường Tân Quang, TP. Tuyên Quang', 'Phường Phan Thiết, TP. Tuyên Quang', 'Phường Minh Xuân, TP. Tuyên Quang',
    'Phường Nông Tiến, TP. Tuyên Quang', 'Phường Tân Hà, TP. Tuyên Quang'
  ],

  'Hà Giang': [
    'Phường Trần Phú, TP. Hà Giang', 'Phường Minh Khai, TP. Hà Giang', 'Phường Nguyễn Trãi, TP. Hà Giang',
    'Phường Quang Trung, TP. Hà Giang', 'Phường Ngọc Hà, TP. Hà Giang'
  ],

  'Cao Bằng': [
    'Phường Hợp Giang, TP. Cao Bằng', 'Phường Sông Bằng, TP. Cao Bằng', 'Phường Tân Giang, TP. Cao Bằng',
    'Phường Sông Hiến, TP. Cao Bằng', 'Phường Đề Thám, TP. Cao Bằng'
  ],

  'Bắc Kạn': [
    'Phường Đức Xuân, TP. Bắc Kạn', 'Phường Sông Cầu, TP. Bắc Kạn', 'Phường Phùng Chí Kiên, TP. Bắc Kạn',
    'Phường Nguyễn Thị Minh Khai, TP. Bắc Kạn', 'Phường Huyền Tụng, TP. Bắc Kạn'
  ]
};

const fileContent = `// Vietnam Administrative Locations (63 Provinces & Municipalities)
// Updated according to Resolution 1278/NQ-UBTVQH15, 1104/NQ-UBTVQH15, 1111/NQ-UBTVQH14
window.VN_LOCATIONS = ${JSON.stringify(locations, null, 2)};
`;

const outputPath = path.join(__dirname, '../public/locations.js');
fs.writeFileSync(outputPath, fileContent, 'utf8');
console.log('Successfully wrote locations.js with', Object.keys(locations).length, 'provinces.');
console.log('TP.HCM has', locations['TP. Hồ Chí Minh'].length, 'wards.');
console.log('Hà Nội has', locations['Hà Nội'].length, 'wards.');
