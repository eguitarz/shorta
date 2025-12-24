"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { supabase } from "@/lib/supabase";
import { validateEmail, isDisposableEmail } from "@/lib/email_validation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Custom email validation with disposable email check
const emailValidation = z
	.string()
	.min(1, "Email is required")
	.email("Please enter a valid email address")
	.toLowerCase()
	.trim()
	.refine(
		(email) => !isDisposableEmail(email),
		{
			message: "Temporary email addresses are not allowed. Please use your primary email address.",
		}
	);

const waitlistSchema = z.object({
	email: emailValidation,
});

type WaitlistFormValues = z.infer<typeof waitlistSchema>;

// Rate limiting: track submissions per email in localStorage
const RATE_LIMIT_KEY = "waitlist_submissions";
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_SUBMISSIONS_PER_WINDOW = 3;

function checkRateLimit(email: string): boolean {
	try {
		const stored = localStorage.getItem(RATE_LIMIT_KEY);
		const data = stored ? JSON.parse(stored) : {};
		const now = Date.now();

		// Clean old entries
		Object.keys(data).forEach((key) => {
			if (now - data[key].timestamp > RATE_LIMIT_WINDOW) {
				delete data[key];
			}
		});

		// Check rate limit for this email
		const emailKey = email.toLowerCase();
		if (data[emailKey]) {
			if (data[emailKey].count >= MAX_SUBMISSIONS_PER_WINDOW) {
				return false;
			}
			data[emailKey].count += 1;
		} else {
			data[emailKey] = { count: 1, timestamp: now };
		}

		localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
		return true;
	} catch {
		return true; // If localStorage fails, allow submission (server will handle it)
	}
}

export function WaitlistForm() {
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm<WaitlistFormValues>({
		resolver: zodResolver(waitlistSchema),
		defaultValues: {
			email: "",
		},
	});

	const onSubmit = async (values: WaitlistFormValues) => {
		if (!supabase) {
			toast.error("Waitlist feature is not configured. Please contact support.");
			return;
		}

		// Client-side rate limiting
		if (!checkRateLimit(values.email)) {
			toast.error("Too many requests. Please try again later.");
			return;
		}

		setIsSubmitting(true);

		try {
			// Additional email validation (domain check)
			const emailValidation = await validateEmail(values.email);
			if (!emailValidation.valid) {
				toast.error(emailValidation.error || "Invalid email address");
				setIsSubmitting(false);
				return;
			}

			// Get IP and user agent for security tracking
			const ipAddress = await fetch("https://api.ipify.org?format=json")
				.then((res) => res.json())
				.then((data) => data.ip)
				.catch(() => null);

			const userAgent = navigator.userAgent;

			// Insert into Supabase
			const { error } = await supabase.from("waitlist").insert({
				email: values.email,
				ip_address: ipAddress,
				user_agent: userAgent,
			});

			if (error) {
				// Debug: log full error structure to diagnose the issue
				console.log("Waitlist submission error details:", {
					code: error.code,
					message: error.message,
					details: error.details,
					hint: error.hint,
					fullError: error
				});

				// Handle unique constraint violation (duplicate email)
				// Check multiple possible error indicators
				if (
					error.code === "23505" || // PostgreSQL unique constraint
					error.code === "409" || // HTTP conflict
					(error.message && error.message.toLowerCase().includes("duplicate")) ||
					(error.message && error.message.toLowerCase().includes("unique")) ||
					(error.details && error.details.toLowerCase().includes("already exists")) ||
					(error.details && error.details.toLowerCase().includes("duplicate"))
				) {
					toast.info("You're already on the waitlist!");
					form.reset();
					setIsSubmitting(false);
					return;
				}

				// Handle other errors
				console.error("Waitlist submission error:", error);
				toast.error("Something went wrong. Please try again.");
				setIsSubmitting(false);
				return;
			}

			toast.success("You're on the waitlist! We'll be in touch soon.");
			form.reset();
		} catch (error) {
			console.error("Unexpected error:", error);
			toast.error("Something went wrong. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel htmlFor="waitlist-email">Email</FormLabel>
							<FormControl>
								<Input
									id="waitlist-email"
									type="email"
									placeholder="your@email.com"
									disabled={isSubmitting}
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button
					type="submit"
					variant="hero"
					size="lg"
					className="w-full"
					disabled={isSubmitting}
				>
					{isSubmitting ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Joining...
						</>
					) : (
						"Join the waitlist"
					)}
				</Button>
			</form>
		</Form>
	);
}
