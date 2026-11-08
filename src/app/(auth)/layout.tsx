import { Brand } from "@/components/layout/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      id="main-content"
      className="flex min-h-svh items-center justify-center bg-canvas px-4 py-10"
    >
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Brand />
        </div>
        {children}
      </div>
    </main>
  );
}
