import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CreatePage from './pages/CreatePage.jsx';
import EventPage from './pages/EventPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CreatePage />} />
        <Route path="/e/:id" element={<EventPage />} />
      </Routes>
    </BrowserRouter>
  );
}
