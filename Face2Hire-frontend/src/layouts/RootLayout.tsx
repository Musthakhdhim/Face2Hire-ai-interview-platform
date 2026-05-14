import type { JSX } from 'react';
import { Outlet } from 'react-router-dom';

export default function RootLayout(): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50">
      <Outlet />
    </div>
  );
}