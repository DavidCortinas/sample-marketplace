import { useState, useEffect, useRef } from 'react';
import { useNavigate, Form, useLoaderData, useFetcher, useOutletContext } from '@remix-run/react';
import { fetchGenres } from '../api/genres';
import { getSession, commitSession, requireUser } from '../session.server';
import { ActionFunction, LoaderFunction, json, redirect } from '@remix-run/node';
import { Combobox } from '@headlessui/react';
import spotifyLogo from '/images/Spotify_Icon_RGB_White.png';
import { useTheme } from '../hooks/useTheme';
import { getRandomColor } from '../utils/forms';
import { OutletContext } from '../types/outlet';

export const loader: LoaderFunction = async ({ request }) => {
  try {
    const session = await getSession(request);

    const user = await requireUser(request);

    const accessToken = session.get("accessToken");

    return json({ user, accessToken });
  } catch (error) {
    console.error("Error in onboarding loader:", error);

    if (error instanceof Response && error.status === 302) {
      return error;
    }

    return redirect("/login");
  }
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const onboardingCompleted = formData.get("onboarding_completed") === "true";

  if (onboardingCompleted) {
    const session = await getSession(request);
    const user = session.get("user");
    const spotifyConnected = session.get("spotifyConnected");

    if (user) {
      const response = await fetch(`${process.env.API_BASE_URL}/api/complete-onboarding/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          spotify_connected: spotifyConnected,
        }),
      });

      if (response.ok) {
        user.onboarding_completed = true;
        session.set("user", user);
        return redirect("/discover", {
          headers: {
            "Set-Cookie": await commitSession(session),
          },
        });
      }
    }
  }

  return redirect("/onboarding?error=onboarding_failed");
};

export default function Onboarding() {
  const { accessToken } = useLoaderData<{ accessToken: string }>();
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { user } = useOutletContext<OutletContext>();
  const fetcher = useFetcher();
  const { isDarkMode } = useTheme();

  const [username, setUsername] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [birthdate, setBirthdate] = useState('');
  const [userType, setUserType] = useState('fan');
  const [profession, setProfession] = useState('');
  const [preferredGenres, setPreferredGenres] = useState<string[]>([]);
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadGenres = async () => {
      try {
        const genres = await fetchGenres();
        setAvailableGenres(genres);
      } catch (error) {
        console.error('Error loading genres:', error);
      }
    };

    loadGenres();
  }, [accessToken]);

  const handleNextStep = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step < 5) {
      handleNextStep();
      return;
    }

    // We're now on the final step (Spotify connection)
    const formData = new FormData(event.currentTarget);
    // Add all necessary form data...

    try {
      const response = await fetch('/api/complete-onboarding', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        // Call the action to update the session
        fetcher.submit(
          { onboarding_completed: "true" },
          { method: "post" }
        );

        // Navigate to dashboard
        navigate('/discover', { replace: true });
      } else {
        console.error('Onboarding submission failed');
        // Handle the error
      }
    } catch (error) {
      console.error('Error submitting onboarding data:', error);
      // Handle the error
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredGenres = query === ''
    ? availableGenres
    : availableGenres.filter((genre) =>
        genre.toLowerCase().includes(query.toLowerCase())
      );

  const handleGenreChange = (selectedGenres: string[]) => {
    setPreferredGenres(selectedGenres);
    setQuery('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  // Add this effect to handle closing the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const maxSteps = 4; // Now includes the Spotify connection step

  return (
      <div className="flex items-center justify-center min-h-screen map-overlay map-background">
        <div className="w-full max-w-md">
          <div className={`p-8 rounded-lg shadow-lg w-full max-w-md
            bg-gradient-to-br from-orange-400 to-pink-500
            dark:from-gray-800 dark:via-gray-900 dark:to-black
            transition-colors duration-300`}>
            <div className="bg-white bg-opacity-90 dark:bg-gray-800 dark:bg-opacity-95 p-6 rounded-md shadow-md">
            <h1 className="text-3xl text-center font-bold text-gray-800">{user ? "Welcome to Audafact," : "Welcome to Audafact"}</h1>
            {user && (
              <h1 className="text-2xl text-center font-bold text-gray-800">
                {user.email}!
              </h1>
            )}
            <p className="text-lg text-center mb-6 text-gray-600">{"Please complete the following steps to start unearthing new gems!"}</p>
            <Form method="post" encType="multipart/form-data" className="space-y-6" onSubmit={handleSubmit}>
              {step === 1 && (
                <div>
                  <h2 className="text-2xl mb-4 font-semibold text-gray-700">Step 1: Basic Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700 mb-1">Profile Image</label>
                      {profileImagePreview && (
                        <div className="my-2 flex justify-center">
                          <img src={profileImagePreview} alt="Profile preview" className="w-32 h-32 object-cover rounded-full" />
                        </div>
                      )}
                      <input
                        type="file"
                        id="profileImage"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 mb-1">Birthdate</label>
                      <input
                        type="date"
                        id="birthdate"
                        value={birthdate}
                        onChange={(e) => setBirthdate(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div>
                  <h2 className="text-2xl font-semibold text-gray-700">{"Step 2: User Type"}</h2>
                  <p className="mb-4 text-sm text-gray-600">{"If you work with music, we'd like to know so we can learn how to best serve you"}</p>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="userType" className="block text-sm font-medium text-gray-700 mb-1">{"User Type"}</label>
                      <select
                        id="userType"
                        value={userType}
                        onChange={(e) => setUserType(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="fan">Fan</option>
                        <option value="professional">Professional</option>
                      </select>
                    </div>
                    {userType === 'professional' && (
                      <div>
                        <label htmlFor="profession" className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
                        <input
                          type="text"
                          id="profession"
                          value={profession}
                          onChange={(e) => setProfession(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
              {step === 3 && (
                <div>
                  <h2 className="text-2xl font-semibold text-gray-700">Step 3: Music Preferences</h2>
                  <p className="mb-4 text-sm text-gray-600">{"Now for some insight into your taste to better customize your experience"}</p>
                  <div className="space-y-4">
                    <Combobox 
                      value={preferredGenres} 
                      onChange={handleGenreChange} 
                      multiple 
                      as="div"
                    >
                      <Combobox.Label className="block text-sm font-medium text-gray-700 mb-2">Preferred Genres</Combobox.Label>
                      <div className="relative mt-1">
                        <Combobox.Input
                          ref={inputRef}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                          onChange={(event) => {
                            setQuery(event.target.value);
                            setIsOpen(true);
                          }}
                          onFocus={() => setIsOpen(true)}
                          displayValue={() => ''}
                        />
                        {isOpen && (
                          <Combobox.Options 
                            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
                            static
                          >
                            {filteredGenres.map((genre) => (
                              <Combobox.Option
                                key={genre}
                                value={genre}
                                className={({ active }) =>
                                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                    active ? 'bg-orange-600 text-white' : 'text-gray-900'
                                  }`
                                }
                              >
                                {({ selected, active }) => (
                                  <>
                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                      {genre}
                                    </span>
                                    {selected ? (
                                      <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-orange-600'}`}>
                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                      </span>
                                    ) : null}
                                  </>
                                )}
                              </Combobox.Option>
                            ))}
                          </Combobox.Options>
                        )}
                      </div>
                    </Combobox>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {preferredGenres.map((genre) => (
                        <span
                          key={genre}
                          className={`px-2 py-1 rounded-full text-sm font-semibold text-white ${getRandomColor()}`}
                        >
                          {genre}
                          <button
                            onClick={() => setPreferredGenres(preferredGenres.filter(g => g !== genre))}
                            className="ml-2 focus:outline-none"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {step === 4 && (
                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-gray-700">Connect with Spotify</h2>
                  <p className="mb-4">Connect your Spotify account to sync your finds and playlists.</p>
                  <p className="mb-4 text-sm text-gray-600">
                    {"Don't have a Spotify account? No worries! You can sign up for free when connecting your account."}
                  </p>
                  <button
                    type="button"
                    onClick={() => window.location.href = '/api/spotify-auth'}
                    className="w-full flex items-center justify-center bg-[#1DB954] text-white py-2 px-4 rounded-md hover:bg-[#1ED760] transition duration-300"
                  >
                    <img src={spotifyLogo} alt="Spotify logo" className="h-8 mr-2" />
                    Connect with Spotify
                  </button>
                </div>
              )}

              <div className="flex justify-between mt-6">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition duration-300"
                  >
                    Previous
                  </button>
                )}
                {step < maxSteps ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition duration-300"
                  >
                    Complete Onboarding
                  </button>
                )}
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}
