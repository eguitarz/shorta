import disposableDomains from 'disposable-email-domains';

/**
 * Check if email domain is a disposable/temporary email provider
 */
export function isDisposableEmail(email: string): boolean {
	const domain = email.split('@')[1]?.toLowerCase();
	if (!domain) return false;
	return (disposableDomains as string[]).includes(domain);
}

/**
 * Validate email domain exists by checking DNS MX records
 * This is a client-side check - server should also validate
 */
export async function validateEmailDomain(email: string): Promise<boolean> {
	const domain = email.split('@')[1];
	if (!domain) return false;

	try {
		// Use a public DNS API to check if domain has MX records
		// This is a simple check - for production, consider using a more robust service
		const response = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`, {
			method: 'GET',
			headers: {
				'Accept': 'application/json',
			},
		});

		if (!response.ok) {
			// If DNS check fails, allow the email (fail open for better UX)
			// Server-side validation will catch invalid domains
			return true;
		}

		const data = await response.json();
		
		// Check if domain has MX records (or A records as fallback)
		const hasMX = data.Answer && data.Answer.length > 0;
		
		if (!hasMX) {
			// Check for A record as fallback (some domains use A records for email)
			const aRecordResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
			if (aRecordResponse.ok) {
				const aData = await aRecordResponse.json();
				return aData.Answer && aData.Answer.length > 0;
			}
		}

		return hasMX;
	} catch (error) {
		// Fail open - allow email if DNS check fails
		// Server-side validation will be more strict
		console.warn('Domain validation check failed:', error);
		return true;
	}
}

/**
 * Comprehensive email validation
 */
export async function validateEmail(email: string): Promise<{ valid: boolean; error?: string }> {
	// Basic format check
	if (!email || !email.includes('@')) {
		return { valid: false, error: 'Please enter a valid email address' };
	}

	const domain = email.split('@')[1];
	if (!domain || !domain.includes('.')) {
		return { valid: false, error: 'Please enter a valid email address' };
	}

	// Check for disposable emails
	if (isDisposableEmail(email)) {
		return { valid: false, error: 'Temporary email addresses are not allowed. Please use your primary email address.' };
	}

	// Check if domain exists (async)
	const domainExists = await validateEmailDomain(email);
	if (!domainExists) {
		return { valid: false, error: 'This email domain does not exist. Please check your email address.' };
	}

	return { valid: true };
}

