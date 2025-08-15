"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Logo } from "./logo";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "./ui/separator";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.63-4.5 1.63-5.52 0-10-4.48-10-10s4.48-10 10-10c2.94 0 5.08 1.18 6.48 2.48l-2.73 2.73c-.76-.76-1.78-1.22-3.75-1.22-4.63 0-8.42 3.8-8.42 8.42s3.8 8.42 8.42 8.42c3.2 0 4.9-1.38 5.2-4.18v-3.28h-9.3z"
      fill="currentColor"
    />
  </svg>
);


export function LoginForm() {
  const { toast } = useToast();
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    try {
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, values.email, values.password);
      // The redirect is handled by the auth hook
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    try {
        await signInWithGoogle();
        // The redirect flow is now handled by the auth hook.
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Google Sign In Failed",
            description: "Could not sign in with Google. Please try again.",
        });
        setIsGoogleLoading(false);
    }
  }


  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Logo />
        </div>
        <CardTitle>Welcome Back</CardTitle>
        <CardDescription>Sign in to continue to PraySmart</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading || isLoading}>
            {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <GoogleIcon className="mr-2 h-4 w-4"/>}
            Sign in with Google
        </Button>
        <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t"/></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or continue with</span></div>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm">
        <p>
          Don&apos;t have an account?&nbsp;
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Sign Up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
