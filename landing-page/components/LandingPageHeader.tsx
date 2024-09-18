import Image from 'next/image';
import Link from 'next/link';

const LandingPageHeader: React.FC = () => {
  const platformUrl = process.env.NEXT_PUBLIC_PLATFORM_URL || "http://localhost:5173";

  return (
    <header className="py-4 px-6">
      <div className="flex justify-between items-center max-w-[1200px] mx-auto">
        <div className="flex items-center">
          <Image
            src="/audafact-temp.png"
            alt="AUDAFACT"
            width={48}
            height={48}
            className="mr-2"
          />
          <Link href="/" className="text-xl font-bold">
            AUDAFACT
          </Link>
        </div>
        <nav className="flex-grow flex justify-center">
          <ul className="flex space-x-6">
            <li><Link href="/" className="hover:text-gray-600">Home</Link></li>
            <li><a href={`${platformUrl}/discover`} target="_blank" rel="noopener noreferrer" className="hover:text-gray-600">Discover</a></li>
            <li><Link href="/licenses" className="hover:text-gray-600">Licenses</Link></li>
            <li><Link href="/about" className="hover:text-gray-600">About</Link></li>
          </ul>
        </nav>
        <div>
          <a href={`${platformUrl}/login?mode=register`} target="_blank" rel="noopener noreferrer" className="text-sm hover:text-gray-600">Create Account</a>
        </div>
      </div>
    </header>
  );
};

export default LandingPageHeader;
