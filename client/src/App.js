import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Chat from './pages/Chat';
import ErrorBoundary from './components/ErrorBoundary';
import './global.css';

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/plan" element={<Chat />} />
          <Route path="/plan/:sessionId" element={<Chat />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}