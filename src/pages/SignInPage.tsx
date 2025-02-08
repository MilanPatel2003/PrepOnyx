import { SignIn } from "@clerk/clerk-react"

const SignInPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-secondary/20 p-4">
      <div className="w-full max-w-md space-y-8 relative">
        <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/5 via-primary/5 to-transparent blur-2xl" />
        
        {/* Content */}
        <div className="relative">
          <div className="flex justify-center">
            <img 
              src="/assets/img/PrepOnyx_New_Logo.svg"
              alt="PrepOnyx Logo"
              className="h-20 w-auto"
            />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-violet-500 via-primary to-indigo-500 bg-clip-text text-transparent">
            Welcome back
          </h2>
          <p className="text-muted-foreground">
            Sign in to your account
          </p>
        </div>

        <div>
          <SignIn 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none bg-transparent",
                headerTitle: "text-foreground",
                headerSubtitle: "text-muted-foreground",
                socialButtonsBlockButton: "bg-white/5 border border-primary/10 hover:bg-primary/5",
                socialButtonsBlockButtonText: "text-foreground",
                dividerLine: "bg-primary/10",
                dividerText: "text-muted-foreground",
                formFieldLabel: "text-foreground",
                formFieldInput: "bg-white/5 border border-primary/10 text-foreground",
                formButtonPrimary: "bg-gradient-to-r from-violet-500 to-primary hover:from-violet-500/90 hover:to-primary/90",
                footerActionLink: "text-primary hover:text-primary/80",
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default SignInPage