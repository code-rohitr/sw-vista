'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { use } from 'react';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  action: z.string().min(1, 'Action is required'),
  scope: z.string().min(1, 'Scope is required'),
  resourceId: z.string().min(1, 'Resource is required'),
});

interface Resource {
  id: string;
  name: string;
  path: string;
}

interface Permission {
  id: string;
  name: string;
  action: string;
  scope: string | null;
  resource: {
    id: string;
    name: string;
    path: string;
  };
}

export default function EditPermissionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [permission, setPermission] = useState<Permission | null>(null);
  
  // Unwrap params using React.use()
  const resolvedParams = use(params);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      action: '',
      scope: '',
      resourceId: '',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch permission details
        const permissionResponse = await fetch(`/api/permissions/${resolvedParams.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!permissionResponse.ok) {
          throw new Error('Failed to fetch permission');
        }

        const permissionData = await permissionResponse.json();
        setPermission(permissionData);

        // Set form values
        form.reset({
          name: permissionData.name,
          action: permissionData.action,
          scope: permissionData.scope || '',
          resourceId: permissionData.resource?.id || '',
        });

        // Fetch resources
        const resourcesResponse = await fetch('/api/resources', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!resourcesResponse.ok) {
          throw new Error('Failed to fetch resources');
        }

        const resourcesData = await resourcesResponse.json();
        setResources(resourcesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load permission data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.id, form, toast]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/permissions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          id: resolvedParams.id,
          ...values,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update permission');
      }

      toast({
        title: 'Success',
        description: 'Permission updated successfully',
      });

      router.push('/admin/permissions');
    } catch (error) {
      console.error('Error updating permission:', error);
      toast({
        title: 'Error',
        description: 'Failed to update permission',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (!permission) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div>Permission not found</div>
          <Button
            onClick={() => router.push('/admin/permissions')}
            className="mt-4"
          >
            Back to Permissions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Permission</h1>
          <p className="text-muted-foreground">
            Update permission details
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permission Details</CardTitle>
          <CardDescription>
            Update the details for this permission
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., view_users" {...field} />
                    </FormControl>
                    <FormDescription>
                      A unique identifier for the permission
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="action"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., view" {...field} />
                    </FormControl>
                    <FormDescription>
                      The action this permission grants (e.g., view, create, update, delete)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scope</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a scope" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="global">Global</SelectItem>
                        <SelectItem value="entity">Entity</SelectItem>
                        <SelectItem value="resource">Resource</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The scope of the permission
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="resourceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resource</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a resource" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {resources.map((resource) => (
                          <SelectItem key={resource.id} value={resource.id}>
                            {resource.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The resource this permission applies to
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 