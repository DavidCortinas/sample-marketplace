import { useLoaderData } from "@remix-run/react";
import { LoaderFunction, json } from "@remix-run/node";
import UploadSamples from "../components/UploadSamples";

export const loader: LoaderFunction = async ({ request }) => {
  // TODO: Implement authentication check and fetch user data
  return json({ user: { name: "Sample User" } });
};

export default function DashboardUpload() {
  const data = useLoaderData<typeof loader>();
  const user = data?.user;

  if (!user) {
    return <div>Loading user data...</div>;
  }

  return (
    <div>
      <UploadSamples />
    </div>
  );
}
