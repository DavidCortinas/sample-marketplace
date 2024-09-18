export default function DashboardOverview() {
  return (
    <div className="space-y-6">
      <div className="flex justify-end items-center">
        {/* <h2 className="text-2xl font-semibold">Seller Dashboard</h2> */}
        <button className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors">
          Upload Sound Artifact
        </button>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Upload Sound Artifact</h3>
        <form>
          <div className="mb-4">
            <label htmlFor="fileInput" className="block text-sm font-medium text-gray-700">Choose File</label>
            <input id="fileInput" type="file" className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-gray-50 file:text-gray-700
              hover:file:bg-gray-100
            "/>
            <p className="mt-1 text-sm text-gray-500">SVG, PNG, JPG or GIF (MAX. 800x400px).</p>
          </div>
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea 
              id="description"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" 
              rows={3}
              placeholder="Type here..."
            ></textarea>
          </div>
          <div className="mb-4">
            <span className="block text-sm font-medium text-gray-700">Artifact Category</span>
            <div className="mt-2 space-x-4">
              {['Music', 'Breaks', 'Loops', 'Sounds'].map((category) => (
                <label key={category} className="inline-flex items-center">
                  <input type="radio" className="form-radio" name="category" value={category} />
                  <span className="ml-2">{category}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700">Tags:</legend>
              <div className="mt-2 grid grid-cols-2 gap-4">
                {['Ambient', 'Percussive', 'Vocal', 'Synth'].map((tag) => (
                  <div key={tag} className="flex items-center p-2 border rounded">
                    <input
                      type="checkbox"
                      id={`tag-${tag}`}
                      name="tags"
                      value={tag}
                      className="mr-2"
                    />
                    <label htmlFor={`tag-${tag}`}>
                      <span className="font-medium">{tag}</span>
                      <p className="text-sm text-gray-500">{
                        tag === 'Ambient' ? 'Relaxing and atmospheric sounds' :
                        tag === 'Percussive' ? 'Rhythmic and drum-based sounds' :
                        tag === 'Vocal' ? 'Sounds with vocal elements' :
                        'Electronic synthesized sounds'
                      }</p>
                    </label>
                  </div>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="mb-4">
            <label className="inline-flex items-center">
              <input type="checkbox" className="form-checkbox" />
              <span className="ml-2">Accept Terms and Conditions</span>
            </label>
          </div>
          <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors">
            Submit
          </button>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Sales Data</h3>
        <div className="flex justify-between items-center mb-4">
          <input 
            type="text" 
            placeholder="Search" 
            className="border rounded-md px-3 py-2"
          />
          <div className="flex space-x-2">
            <button className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors">
              + Action
            </button>
            <select className="border rounded-md px-3 py-2">
              <option>Actions</option>
            </select>
            <select className="border rounded-md px-3 py-2">
              <option>Filter</option>
            </select>
          </div>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Top Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Add table rows here */}
          </tbody>
        </table>
        <div className="mt-4 flex justify-between items-center">
          <span>Showing 1-10 of 1000</span>
          <div className="flex space-x-2">
            <button className="border rounded-md px-3 py-1">&lt;</button>
            <button className="border rounded-md px-3 py-1">1</button>
            <button className="border rounded-md px-3 py-1">2</button>
            <button className="border rounded-md px-3 py-1">3</button>
            <button className="border rounded-md px-3 py-1">&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
}
