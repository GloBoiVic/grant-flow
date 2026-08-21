import { SignIn } from "@clerk/nextjs";

export default function LoginPage(): React.ReactNode {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <SignIn
        path="/login"
        routing="path"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/"
        appearance={{
          variables: {
            colorPrimary: "var(--primary)",
            colorBackground: "var(--card)",
            borderRadius: "var(--radius-md)",
            fontFamily: "var(--font-sans)",
          },
          elements: {
            card: "border border-border bg-card shadow-sm",
            headerTitle: "text-title",
            headerSubtitle: "text-sm text-muted-foreground",
            formFieldLabel: "text-sm text-foreground",
            formFieldInput: "h-9 border-input text-sm shadow-none",
            formButtonPrimary: "h-9 bg-primary text-sm hover:bg-primary-hover",
            footerActionText: "text-sm text-muted-foreground",
            footerActionLink: "text-sm text-primary hover:text-primary-hover",
          },
        }}
      />
    </main>
  );
}
