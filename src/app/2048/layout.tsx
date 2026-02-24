import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: '2048 Game',
  description: 'Play 2048 on your iPhone',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '2048',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full w-full overflow-hidden">
      {children}
    </div>
  );
}
