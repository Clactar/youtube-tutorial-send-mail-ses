"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { sendEmail } from "@/lib/sendEmailAction";

const contactFormSchema = z.object({
  from: z.string().email("Invalid email"),
  to: z.string().email("Invalid email"),
  subject: z.string().min(1, "Subject is required"),
  text: z.string().min(1, "Message is required"),
});

type ContactFormType = z.infer<typeof contactFormSchema>;

export function ContactForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const form = useForm<ContactFormType>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      from: "",
      to: "",
      subject: "",
      text: "",
    },
  });

  const onSubmit = async (data: ContactFormType) => {
    setError(null);
    setSuccess(false);

    const result = await sendEmail(data);

    if (!result.success) {
      setError(result.error || "An error occurred");
      return;
    }

    setSuccess(true);
    form.reset();
  };

  return (
    <Card className='mx-auto max-w-lg'>
      <CardHeader>
        <CardTitle className='text-2xl'>Contact Us</CardTitle>
        <CardDescription>
          Send us a message by filling out the form below
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant='destructive' className='mb-4'>
            <ExclamationTriangleIcon className='h-4 w-4' />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className='mb-4'>
            <AlertDescription>
              Your message has been sent successfully!
            </AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='grid gap-4'
            noValidate
          >
            <FormField
              control={form.control}
              name='from'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='email'
                      placeholder='your@email.com'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='to'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='email'
                      placeholder='recipient@email.com'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='subject'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='Message subject' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='text'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder='Your message'
                      className='min-h-[100px]'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type='submit'
              className='w-full'
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Sending..." : "Send"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
