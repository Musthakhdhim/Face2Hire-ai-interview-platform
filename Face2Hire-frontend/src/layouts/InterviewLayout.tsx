import { Outlet } from 'react-router-dom';
import type { JSX } from 'react';

export default function InterviewLayout(): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}