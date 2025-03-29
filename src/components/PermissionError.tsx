import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface PermissionErrorProps {
  message?: string;
  redirectPath?: string;
  redirectLabel?: string;
}

export default function PermissionError({
  message = 'You do not have permission to access this resource',
  redirectPath = '/dashboard',
  redirectLabel = 'Return to Dashboard'
}: PermissionErrorProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-red-600">Access Denied</CardTitle>
          <CardDescription>Permission Error</CardDescription>
        </CardHeader>
        <CardContent>
          <p>{message}</p>
        </CardContent>
        <div className="p-4 flex justify-end">
          <Button onClick={() => router.push(redirectPath)}>
            {redirectLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}