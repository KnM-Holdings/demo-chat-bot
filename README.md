# LangGraph Chatbot - React Application

Ứng dụng chatbot React sử dụng `@langchain/langgraph-sdk` để tương tác với LangGraph server. Ứng dụng hỗ trợ streaming messages real-time với giao diện chat hiện đại và đẹp mắt.

## 📋 Mục lục

- [Cài đặt](#cài-đặt)
- [Cấu hình](#cấu-hình)
- [Cách sử dụng](#cách-sử-dụng)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Tính năng](#tính-năng)

---

## 🚀 Cài đặt

1. **Clone repository** (nếu có) hoặc tạo project mới

2. **Cài đặt dependencies:**


```bash
npm install
```

---

## ⚙️ Cấu hình

### Cấu hình cơ bản

Bạn có thể cấu hình LangGraph server trong file `src/services/langgraphService.js`:

```javascript
// Configuration
const API_URL = "";
// const API_KEY = 'sk-proj-1234567890';  // Uncomment nếu cần API key
```

**Lưu ý:** Assistant ID sẽ được tự động lấy từ server bằng cách search assistants và lấy assistant đầu tiên.

### Cấu hình API URL bằng Environment Variables (Tùy chọn)

Bạn có thể sử dụng environment variables để cấu hình API URL:

1. **Tạo file `.env`** trong thư mục root:
```env
VITE_LANGGRAPH_API_URL=
```

2. **Cập nhật `src/services/langgraphService.js`** để sử dụng env variable:
```javascript
const API_URL = import.meta.env.VITE_LANGGRAPH_API_URL;
```

---

## 💻 Cách sử dụng

### Development Mode

1. **Khởi động development server:**
```bash
npm run dev
```

2. **Mở trình duyệt:**
- Ứng dụng sẽ chạy tại `http://localhost:5173` (hoặc port khác nếu 5173 đã được sử dụng)
- Vite sẽ tự động hiển thị URL trong terminal

3. **Sử dụng chatbot:**
   - Nhập tin nhắn vào ô input
   - Nhấn Enter hoặc click nút gửi (📤)
   - Bot sẽ trả lời với streaming real-time
   - Cursor nháy sẽ hiển thị khi bot đang trả lời và tự động ẩn khi hoàn thành

---

### Production Build

1. **Build ứng dụng:**
```bash
npm run build
```

2. **Preview build:**
```bash
npm run preview
```

3. **Deploy:**
   - File build sẽ nằm trong thư mục `dist/`
   - Bạn có thể deploy lên bất kỳ static hosting nào (Vercel, Netlify, GitHub Pages, etc.)

---

## 📁 Cấu trúc dự án

```
langgrap/
├── src/
│   ├── components/
│   │   ├── ChatBot.jsx      # Component chính của chatbot
│   │   └── ChatBot.css      # Styles cho chatbot
│   ├── services/
│   │   └── langgraphService.js  # Service xử lý LangGraph SDK
│   ├── App.jsx              # App component
│   ├── App.css              # App styles
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── public/                  # Static files
├── index.html               # HTML template
├── vite.config.js           # Vite configuration
├── package.json             # Dependencies
└── README.md                # Documentation
```

---

## ✨ Tính năng

- ✅ **Giao diện chat hiện đại**: UI đẹp mắt với gradient teal/cyan
- ✅ **Streaming real-time**: Messages được stream từ LangGraph server
- ✅ **Xử lý interrupted threads**: Tự động resume khi thread bị interrupted
- ✅ **Typing indicator**: Cursor nháy hiển thị khi bot đang trả lời
- ✅ **Error handling**: Hiển thị thông báo lỗi rõ ràng với banner đẹp
- ✅ **Auto-scroll**: Tự động scroll đến tin nhắn mới nhất
- ✅ **Responsive design**: Hoạt động tốt trên mọi kích thước màn hình
- ✅ **Thread management**: Tự động tạo và quản lý threads với UUID

---

## 📝 Ghi chú

- Thread ID được tự động generate bằng `crypto.randomUUID()` khi khởi tạo
- Assistant ID sẽ được tự động lấy bằng cách search assistants từ server và lấy assistant đầu tiên
- Retry mechanism đã được tắt (`maxRetries: 0`) để tránh gọi API nhiều lần
- API URL được cấu hình trong `src/services/langgraphService.js` (có thể dùng env variable `VITE_LANGGRAPH_API_URL`)

---

## 🔗 Tài liệu tham khảo

- [LangGraph SDK Documentation](https://github.com/langchain-ai/langgraph-sdk)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)

---

## 📄 License

MIT
