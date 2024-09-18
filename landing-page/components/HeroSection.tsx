import React from 'react';
import Image from 'next/image';

const HeroSection: React.FC = () => {
  return (
    <section className="bg-[#f9fafc]">
      <div className="flex justify-between items-center px-6 max-w-[1200px] mx-auto">
        <div className="w-1/2 pr-8">
          <h1 className="text-4xl font-bold mb-4">Discover and License Unique Sound Artifacts</h1>
          <p className="text-xl mb-6">Explore a collection of music, breaks, loops, and sounds</p>
          <a 
            href="http://localhost:5173" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block bg-orange-500 text-white px-6 py-2 rounded-md hover:bg-orange-600 transition-colors"
          >
            Get Started
          </a>
        </div>
        <div className="w-1/2">
          <Image 
            src="/hero-image.jpg" 
            alt="Colorful sound artifacts" 
            width={500} 
            height={500}
            className="w-full h-auto"
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
