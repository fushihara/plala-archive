import { redirect } from "next/navigation";


export default async function Page() {
  redirect("/list/has-contents-page-1");
  return (
    <div className="container mx-auto font-mono">
      あいうえお
    </div>
  );
}