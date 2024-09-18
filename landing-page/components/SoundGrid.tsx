import React from 'react';
import Image from 'next/image';

interface SoundItem {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
}

const SoundGrid: React.FC = () => {
  const soundItems: SoundItem[] = [
    { id: '1', title: 'Ethereal Melodies', price: 10, imageUrl: '/sound1.jpg' },
    { id: '2', title: 'Rhythmic Beats', price: 15, imageUrl: '/sound2.jpg' },
    { id: '3', title: 'Soulful Loops', price: 12, imageUrl: '/sound3.jpg' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12 px-6">
      {soundItems.map((item) => (
        <div key={item.id} className="bg-gray-100 rounded-lg overflow-hidden">
          <Image 
            src={item.imageUrl} 
            alt={item.title} 
            width={300} 
            height={300}
            className="w-full h-64 object-cover"
          />
          <div className="p-4">
            <h3 className="font-semibold">{item.title}</h3>
            <p className="text-gray-600">${item.price}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SoundGrid;
