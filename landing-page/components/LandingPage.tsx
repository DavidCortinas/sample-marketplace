import React from 'react';
import LandingPageHeader from '../components/LandingPageHeader';
import HeroSection from '../components/HeroSection';
import SoundGrid from '../components/SoundGrid';
import CallToAction from '../components/CallToAction';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <LandingPageHeader />
      <main>
        <HeroSection />
        <SoundGrid />
        <CallToAction />
      </main>
    </div>
  );
};

export default LandingPage;
