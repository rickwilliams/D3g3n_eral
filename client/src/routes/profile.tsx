import { UserProfile } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Manage Your Account</CardTitle>
          <CardDescription>
            Update your account settings and manage your ElizaOS profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserProfile />
        </CardContent>
      </Card>
    </div>
  );
} 