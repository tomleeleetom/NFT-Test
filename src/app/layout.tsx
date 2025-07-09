import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppWalletProvider } from '../components/WalletProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Solana NFT Demo',
  description: '在 Solana 上鑄造你的第一個 NFT',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-HK">
      <body className={inter.className}>
        <AppWalletProvider>
          {children}
        </AppWalletProvider>
      </body>
    </html>
  );
}