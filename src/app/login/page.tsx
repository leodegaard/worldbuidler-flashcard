import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form action={login} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">Worldbuilding Flashcards</h1>
        <Input
          type="password"
          name="password"
          placeholder="Password"
          autoFocus
          required
        />
        {error && (
          <p className="text-sm text-red-600">Incorrect password.</p>
        )}
        <Button type="submit" className="w-full">
          Log in
        </Button>
      </form>
    </main>
  );
}
