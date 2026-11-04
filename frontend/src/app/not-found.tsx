import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <h1>Task not found</h1>
      <p>It may have been deleted, or the address is incorrect.</p>
      <Link href="/" className="button secondary">
        Back to the list
      </Link>
    </>
  );
}
