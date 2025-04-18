import { SignUp } from "@clerk/clerk-react"

const SignUpPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-secondary/20 p-4">
      <div className="w-full max-w-md space-y-8 relative">
        <div className="absolute -inset-4 bg-gradient-to-r from-primary/5 via-violet-500/5 to-transparent blur-2xl" />
        
        {/* Content */}
        <div className="relative">
          <div className="flex justify-center">
            <img 
              src="/assets/img/temp.png"
              alt="PrepOnyx Logo"
              className="h-20 w-auto"
            />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary via-violet-500 to-indigo-500 bg-clip-text text-transparent">
            Create your account
          </h2>
          <p className="text-muted-foreground">
            Start your journey with PrepOnyx
          </p>
        </div>

        <div>
          <SignUp 
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
                formButtonPrimary: "bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90",
                footerActionLink: "text-primary hover:text-primary/80",
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default SignUpPage