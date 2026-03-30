import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'] });

export const metadata = {
  title: 'Kirushu - Habit Tracker',
  description: 'Daily Habit Tracker with AI coach',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark">
      <body className={outfit.className}>
        {children}
      </body>
    </html>
  );
}
