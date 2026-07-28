// BrowserRouter: 브라우저 주소창 URL을 라우팅에 사용하겠다고 선언
// Routes: Route들의 컨테이너 — 현재 URL과 일치하는 Route 하나를 골라 렌더링
// Route: path(어느 URL일 때) + element(무엇을 보여줄지) 한 쌍
import { BrowserRouter, Routes, Route } from "react-router-dom";

// src/pages/ 안에 만들어둔 페이지 컴포넌트들을 가져옴
import ConcertListPage from "./pages/ConcertListPage";
import ConcertDetailPage from "./pages/ConcertDetailPage";
import SeatSelectionPage from "./pages/SeatSelectionPage";
import BookingConfirmPage from "./pages/BookingConfirmPage";

export default function App() {
  return (
    // BrowserRouter는 앱 전체를 한 번만 감쌈
    <BrowserRouter>
      <Routes>
        {/* path: 내가 설계한 URL 구조 / element: 그 URL에서 보여줄 컴포넌트 */}
        <Route path="/" element={<ConcertListPage />} />

        {/* :id 는 동적 세그먼트 — /concerts/123 이든 /concerts/abc 이든 이 Route에 걸림 */}
        <Route path="/concerts/:id" element={<ConcertDetailPage />} />

        {/* 같은 :id를 공유하는 하위 경로 — 어느 공연의 좌석인지 알기 위해 :id가 포함됨 */}
        <Route path="/concerts/:id/seats" element={<SeatSelectionPage />} />

        {/* :bookingId 는 예매 번호 — 이 URL로 나중에 예매 내역을 다시 확인할 수 있음 */}
        <Route path="/bookings/:bookingId" element={<BookingConfirmPage />} />

        {/* path="*" 는 위 네 개에 해당하지 않는 모든 URL을 잡음 */}
        <Route path="*" element={<p>페이지를 찾을 수 없습니다</p>} />
      </Routes>
    </BrowserRouter>
  );
}
