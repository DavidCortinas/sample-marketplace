import React from 'react';

const CallToAction: React.FC = () => {
  return (
    <section className="text-center py-12 px-6">
      <h2 className="text-3xl font-bold mb-4">Call to Action</h2>
      <p className="mb-6">Discover and License Unique Sound Artifacts</p>
      <a 
        href={process.env.NEXT_PUBLIC_PLATFORM_URL || "http://localhost:5173"}
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-block bg-orange-500 text-white px-6 py-2 rounded-md hover:bg-orange-600 transition-colors"
      >
        Get Started
      </a>
    </section>
  );
};

export default CallToAction;
