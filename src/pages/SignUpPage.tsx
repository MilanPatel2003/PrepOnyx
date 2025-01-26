import { SignUp } from "@clerk/clerk-react"

const SignUpPage = () => {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-50 items-center justify-center p-12">
        <img 
          src="/assets/img/signup.svg" 
          alt="Sign Up Illustration"
          className="max-w-full h-auto"
        />
      </div>

      {/* Right side - Sign Up Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <img 
              src="/assets/img/PrepOnyx_logo.png"
              alt="PrepOnyx Logo"
              className="h-18 w-auto"
            />
          </div>

          {/* Title */}
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Start your journey with PrepOnyx
            </p>
          </div>

          {/* Clerk Sign Up Component */}
          <SignUp 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none",
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default SignUpPage