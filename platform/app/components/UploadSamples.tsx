import { useState, ChangeEvent, useEffect } from "react";
import { Form } from "@remix-run/react";

export default function UploadSamples() {
  const [files, setFiles] = useState<File[]>([]);
  const [sampleDetails, setSampleDetails] = useState<Array<{
    title: string,
    description: string,
    genre: string,
    bpm: string,
    key: string,
    price: string,
    collection: string
  }>>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };

  useEffect(() => {
    setSampleDetails(prevDetails => {
      const newDetails = [...prevDetails];
      while (newDetails.length < files.length) {
        newDetails.push({ title: "", description: "", genre: "", bpm: "", key: "", price: "", collection: "" });
      }
      return newDetails;
    });
  }, [files]);

  const handleDetailChange = (index: number, field: string, value: string) => {
    setSampleDetails(prevDetails => {
      const newDetails = [...prevDetails];
      newDetails[index] = { ...newDetails[index], [field]: value };
      return newDetails;
    });
  };

  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    setSampleDetails(prevDetails => prevDetails.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Upload Samples</h2>
      <p className="mb-4 text-gray-600">
        Upload one or multiple tracks, then fill in details such as name, genre, and price for each sample.
      </p>
      <Form method="post" encType="multipart/form-data">
        <div className="mb-4">
          <label htmlFor="sampleFiles" className="block text-sm font-medium text-gray-700 mb-2">
            Audio Samples
          </label>
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="sampleFiles"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              aria-label="Upload audio samples"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-gray-500">WAV, MP3, or AIFF (MAX. 500MB)</p>
              </div>
              <input
                id="sampleFiles"
                name="sampleFiles"
                type="file"
                multiple
                onChange={handleFileChange}
                accept="audio/*"
                className="hidden"
              />
            </label>
          </div>
          {files.length > 0 && (
            <p className="mt-2 text-sm text-gray-500">
              Selected files: {files.map(file => file.name).join(", ")}
            </p>
          )}
        </div>

        {files.map((file, index) => (
          <div key={index} className="mb-6 p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Sample {index + 1}: {file.name}</h3>
            
            <div className="mb-4">
              <label htmlFor={`title-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                Sample Title
              </label>
              <input
                type="text"
                id={`title-${index}`}
                name={`title-${index}`}
                value={sampleDetails[index]?.title || ''}
                onChange={(e) => handleDetailChange(index, 'title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor={`description-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id={`description-${index}`}
                name={`description-${index}`}
                rows={3}
                value={sampleDetails[index]?.description || ''}
                onChange={(e) => handleDetailChange(index, 'description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              ></textarea>
            </div>

            <div className="mb-4">
              <label htmlFor={`genre-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                Genre
              </label>
              <select
                id={`genre-${index}`}
                name={`genre-${index}`}
                value={sampleDetails[index]?.genre || ''}
                onChange={(e) => handleDetailChange(index, 'genre', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a genre</option>
                <option value="electronic">Electronic</option>
                <option value="hip-hop">Hip Hop</option>
                <option value="rock">Rock</option>
                <option value="jazz">Jazz</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor={`bpm-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                BPM
              </label>
              <input
                type="number"
                id={`bpm-${index}`}
                name={`bpm-${index}`}
                min="1"
                max="300"
                value={sampleDetails[index]?.bpm || ''}
                onChange={(e) => handleDetailChange(index, 'bpm', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="mb-4">
              <label htmlFor={`key-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                Key
              </label>
              <input
                type="text"
                id={`key-${index}`}
                name={`key-${index}`}
                value={sampleDetails[index]?.key || ''}
                onChange={(e) => handleDetailChange(index, 'key', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="mb-4">
              <label htmlFor={`price-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                Price ($)
              </label>
              <input
                type="number"
                id={`price-${index}`}
                name={`price-${index}`}
                min="0"
                step="0.01"
                value={sampleDetails[index]?.price || ''}
                onChange={(e) => handleDetailChange(index, 'price', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor={`collection-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                Collection
              </label>
              <input
                type="text"
                id={`collection-${index}`}
                name={`collection-${index}`}
                value={sampleDetails[index]?.collection || ''}
                onChange={(e) => handleDetailChange(index, 'collection', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <button
              type="button"
              onClick={() => removeFile(index)}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              Remove this sample
            </button>
          </div>
        ))}

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={isUploading || files.length === 0}
        >
          {isUploading ? "Uploading..." : "Upload Samples"}
        </button>
      </Form>
    </div>
  );
}
