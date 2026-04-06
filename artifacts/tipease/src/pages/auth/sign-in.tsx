import { SignIn } from "@clerk/react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function SignInPage() {
  return (
    <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
        <SignIn 
          routing="path" 
          path={`${basePath}/sign-in`} 
          signUpUrl={`${basePath}/sign-up`} 
          appearance={{
            elements: {
              formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground",
              card: "bg-card border border-border rounded-xl shadow-xl",
              headerTitle: "text-foreground",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton: "border-border text-foreground hover:bg-muted",
              dividerLine: "bg-border",
              dividerText: "text-muted-foreground",
              formFieldLabel: "text-foreground",
              formFieldInput: "bg-input border-border text-foreground",
              footerActionText: "text-muted-foreground",
              footerActionLink: "text-primary hover:text-primary/90"
            }
          }}
        />
      </div>
    </div>
  );
}
