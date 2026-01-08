import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { userAPI } from '@/lib/api';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  reason: z.string().optional(),
});

type DeleteAccountFormValues = z.infer<typeof deleteAccountSchema>;

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const { logout } = useAuth();
  const form = useForm<DeleteAccountFormValues>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      password: '',
      reason: '',
    },
  });

  const onSubmit = async (data: DeleteAccountFormValues) => {
    try {
      await userAPI.deleteAccount(data.password, data.reason);
      
      // Use the proper logout method that clears HTTP-only cookies
      await logout();
      
      toast({
        title: "Account deactivated",
        description: "Your account has been successfully deactivated.",
      });
      
      // Redirect to landing page
      window.location.href = '/';
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to deactivate account",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Deactivate Account
          </DialogTitle>
          <DialogDescription>
            This will deactivate your account and hide it from other users. Your data will be preserved and can be restored by contacting support.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 my-4">
          <p className="text-sm text-orange-800 font-medium">
            ⚠️ Account Deactivation
          </p>
          <p className="text-sm text-orange-700 mt-1">
            Your account will be hidden but your data will be preserved. Contact support if you need to restore your account.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for deactivating (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Help us improve by sharing why you're deactivating your account..."
                      className="min-h-[80px]"
                    />
                  </FormControl>
                  <FormDescription>
                    This information helps us improve our service.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm your password to deactivate account</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="password" 
                      placeholder="Enter your password"
                      className="border-red-300 focus:border-red-500 focus:ring-red-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                Deactivate Account
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAccountModal; 