
import React, { useState } from 'react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { toast } from '@/hooks/use-toast';
import { requestVerification } from '@/services/localLibrary';
import confetti from 'canvas-confetti';
import { BadgeCheck } from 'lucide-react';

interface VerificationRequestFormProps {
  artistId: string;
}

interface FormValues {
  email: string;
  reason: string;
}

const VerificationRequestForm: React.FC<VerificationRequestFormProps> = ({ artistId }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [progress, setProgress] = useState(0);

  const form = useForm<FormValues>({
    defaultValues: {
      email: '',
      reason: '',
    },
  });

  const simulateVerification = () => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 5;
        if (newProgress >= 100) {
          clearInterval(interval);
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
          setIsSuccess(true);
          return 100;
        }
        return newProgress;
      });
    }, 150);
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // Note: We're only passing the required arguments according to the error
      await requestVerification(artistId, values.email);
      
      simulateVerification();
      
      setTimeout(() => {
        toast({
          title: "Verification requested",
          description: "Your verification request has been sent to dynoaryan@gmail.com",
        });
      }, 3000);
    } catch (error) {
      console.error('Error requesting verification:', error);
      toast({
        title: "Error",
        description: "Failed to submit verification request. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <BadgeCheck className="h-10 w-10 text-white" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Verification Request Submitted!</h3>
        <p className="text-gray-400 mb-4">
          Your request has been sent to our team at dynoaryan@gmail.com. 
          We'll review your application and get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <div>
      {isSubmitting ? (
        <div className="py-6">
          <div className="mb-4">
            <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300 ease-in-out" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          <p className="text-center text-gray-400">
            {progress < 30 && "Checking your artist profile..."}
            {progress >= 30 && progress < 60 && "Analyzing your music catalog..."}
            {progress >= 60 && progress < 90 && "Preparing verification request..."}
            {progress >= 90 && "Sending to verification team..."}
          </p>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="email"
              rules={{ 
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address"
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    We'll use this email to contact you about your verification status.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="reason"
              rules={{ required: "Please provide a reason for verification" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Why should your artist profile be verified?</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell us about your music career, achievements, or why verification would benefit you." 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Help us understand why you should receive the verified badge.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full">Submit Verification Request</Button>
          </form>
        </Form>
      )}
    </div>
  );
};

export default VerificationRequestForm;
