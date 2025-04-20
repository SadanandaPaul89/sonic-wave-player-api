
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { requestVerification } from '@/services/localLibrary';

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
});

interface VerificationRequestFormProps {
  artistId: string;
  onSuccess?: () => void;
}

const VerificationRequestForm: React.FC<VerificationRequestFormProps> = ({ artistId, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      await requestVerification(artistId, values.email);
      
      toast({
        title: "Verification Request Submitted",
        description: "We've sent your verification request. You'll be notified once it's reviewed.",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting verification request:', error);
      toast({
        title: "Error",
        description: "Failed to submit verification request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="mb-4">
          <p className="text-sm text-gray-500">
            Verification requests are reviewed by our team. Once approved, your profile will receive a verified badge.
          </p>
        </div>
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Email</FormLabel>
              <FormControl>
                <Input placeholder="your@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Submitting..." : "Request Verification"}
        </Button>
      </form>
    </Form>
  );
};

export default VerificationRequestForm;
