import { LoaderFunction, redirect } from "@remix-run/node";

export const loader: LoaderFunction = () => {
  console.log("Index loader - Redirecting to /discover");
  return redirect("/discover");
};

export default function Index() {
  return null;
}
