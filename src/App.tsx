// BrowserRouter: 브라우저 주소창 URL을 라우팅에 사용하겠다고 선언
// Routes: Route들의 컨테이너 — 현재 URL과 일치하는 Route 하나를 골라 렌더링
// Route: path(어느 URL일 때) + element(무엇을 보여줄지) 한 쌍
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ConcertListPage from "./pages/ConcertListPage";
import ConcertDetailPage from "./pages/ConcertDetailPage";
import SeatSelectionPage from "./pages/SeatSelectionPage";
import BookingConfirmPage from "./pages/BookingConfirmPage";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<ConcertListPage />} />
          <Route path="/concerts/:id" element={<ConcertDetailPage />} />
          <Route path="/concerts/:id/seats" element={<SeatSelectionPage />} />
          <Route path="/bookings/:bookingId" element={<BookingConfirmPage />} />
          <Route path="*" element={<p>페이지를 찾을 수 없습니다</p>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
