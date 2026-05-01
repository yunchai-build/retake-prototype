import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import InviterPage from './pages/InviterPage.jsx';
import InviteePage from './pages/InviteePage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InviterPage />} />
        <Route path="/invitee" element={<InviteePage />} />
      </Routes>
    </BrowserRouter>
  );
}
