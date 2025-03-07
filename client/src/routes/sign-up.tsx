import { SignUp } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>
            Sign up to create and manage your ElizaOS characters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignUp 
            routing="path" 
            path="/sign-up" 
            signInUrl="/sign-in" 
            redirectUrl="/"
          />
        </CardContent>
      </Card>
    </div>
  );
} 