import dynamic from 'next/dynamic';

const HeroSection = dynamic(() => import('../components/HeroSection'), { ssr: false });

export default function Home() {
  return (
    <main>
      <HeroSection />
    </main>
  );
}
