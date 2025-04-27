import { Metadata } from 'next';
import { HomePage } from './(index)/ui/home';

export const metadata: Metadata = {
  title: 'Pixel canvas › anivire',
};

export default function Home() {
  return <HomePage />;
}
