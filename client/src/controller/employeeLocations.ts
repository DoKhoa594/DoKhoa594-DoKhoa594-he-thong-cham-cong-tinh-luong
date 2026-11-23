// Current provincial names and historical names that can appear on birth records.
export const birthPlaces = [
  "An Giang", "Bắc Ninh", "Cà Mau", "Cần Thơ", "Cao Bằng", "Đà Nẵng",
  "Đắk Lắk", "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Nội",
  "Hà Tĩnh", "Hải Phòng", "Hồ Chí Minh", "Huế", "Hưng Yên", "Khánh Hòa",
  "Lai Châu", "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Nghệ An", "Ninh Bình",
  "Phú Thọ", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sơn La", "Tây Ninh",
  "Thái Nguyên", "Thanh Hóa", "Tuyên Quang", "Vĩnh Long",
  "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu", "Bến Tre",
  "Bình Định", "Bình Dương", "Bình Phước", "Bình Thuận", "Đắk Nông",
  "Hà Giang", "Hà Nam", "Hải Dương", "Hậu Giang", "Hòa Bình", "Kiên Giang",
  "Kon Tum", "Long An", "Nam Định", "Ninh Thuận", "Phú Yên", "Quảng Bình",
  "Quảng Nam", "Sóc Trăng", "Thái Bình", "Thừa Thiên Huế", "Tiền Giang",
  "Trà Vinh", "Vĩnh Phúc", "Yên Bái",
].sort((a, b) => a.localeCompare(b, "vi"));

export const birthPlaceOptions = birthPlaces.map(label => ({ label }));

// Danh mục các dân tộc Việt Nam, Cục Thống kê.
export const ethnicityOptions = [
  "Kinh", "Tày", "Thái", "Mường", "Khmer", "Hoa", "Nùng", "Mông", "Dao",
  "Gia Rai", "Ngái", "Ê Đê", "Ba Na", "Xơ Đăng", "Sán Chay", "Cơ Ho",
  "Chăm", "Sán Dìu", "Hrê", "Mnông", "Ra Glai", "Xtiêng", "Bru - Vân Kiều",
  "Thổ", "Giáy", "Cơ Tu", "Giẻ Triêng", "Mạ", "Khơ Mú", "Co", "Tà Ôi",
  "Chơ Ro", "Kháng", "Xinh Mun", "Hà Nhì", "Chu Ru", "Lào", "La Chí",
  "La Ha", "Phù Lá", "La Hủ", "Lự", "Lô Lô", "Chứt", "Mảng", "Pà Thẻn",
  "Cơ Lao", "Cống", "Bố Y", "Si La", "Pu Péo", "Brâu", "Ơ Đu", "Rơ Măm",
].map(label => ({ label })).sort((a, b) => a.label.localeCompare(b.label, "vi"));

// ISO 3166-1 codes for the 193 UN members and the two observer states.
const countryCodes = `
AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ
CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET
FI FJ FM FR GA GB GD GE GH GM GN GQ GR GT GW GY HN HR HT HU ID IE IL IN IQ IR IS IT
JM JO JP KE KG KH KI KM KN KP KR KW KZ LA LB LC LI LK LR LS LT LU LV LY
MA MC MD ME MG MH MK ML MM MN MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ
OM PA PE PG PH PK PL PS PT PW PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN
SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TV TZ UA UG US UY UZ
VA VC VE VN VU WS YE ZA ZM ZW
`.trim().split(/\s+/);

const vietnameseCountries = new Intl.DisplayNames("vi", { type: "region" });
const englishCountries = new Intl.DisplayNames("en", { type: "region" });

export const nationalities = countryCodes.map(code => ({
  label: vietnameseCountries.of(code) ?? code,
  keywords: `${code} ${englishCountries.of(code) ?? ""}`,
})).sort((a, b) => a.label.localeCompare(b.label, "vi"));
