import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EvidencePanel, type BeatIssueEvidence } from '../components/analyzer/EvidencePanel';

vi.mock('next-intl', () => ({
	useTranslations: () => (key: string, vars?: Record<string, any>) => {
		if (vars && vars.time) return `${key}:${vars.time}`;
		return key;
	},
}));

const ruleEvidence: BeatIssueEvidence = {
	kind: 'rule',
	ruleId: 'th_hook_timing',
	ruleName: 'Hook Within 3 Seconds',
	description: 'The hook must grab attention within the first 3 seconds',
	check: 'Does the video have a compelling hook in the first 0-3 seconds?',
	goodExample: 'Start with the punchline directly.',
	severity: 'critical',
	category: 'hook',
};

const aiEvidencePopulated: BeatIssueEvidence = {
	kind: 'ai',
	startTime: 12,
	transcriptSnippet: 'So anyway, back to what I was saying...',
	reasoning: 'Filler phrase drops energy after the hook.',
};

const aiEvidenceEmpty: BeatIssueEvidence = { kind: 'ai' };

describe('EvidencePanel', () => {
	it('renders nothing when evidence is null', () => {
		const { container } = render(<EvidencePanel evidence={null} />);
		expect(container.firstChild).toBeNull();
	});

	it('renders nothing for AI evidence with no transcript or reasoning (Phase 1a)', () => {
		const { container } = render(<EvidencePanel evidence={aiEvidenceEmpty} />);
		expect(container.firstChild).toBeNull();
	});

	it('renders toggle for rule evidence but keeps body hidden until clicked', () => {
		render(<EvidencePanel evidence={ruleEvidence} />);
		expect(screen.getByRole('button', { name: /toggle/ })).toBeTruthy();
		expect(screen.queryByText('Hook Within 3 Seconds')).toBeNull();
	});

	it('expands rule evidence body with rule name, description, check, and good example', () => {
		render(<EvidencePanel evidence={ruleEvidence} />);
		fireEvent.click(screen.getByRole('button'));
		expect(screen.getByText('Hook Within 3 Seconds')).toBeTruthy();
		expect(screen.getByText(/first 3 seconds/)).toBeTruthy();
		expect(screen.getByText(/compelling hook/)).toBeTruthy();
		expect(screen.getByText('Start with the punchline directly.')).toBeTruthy();
	});

	it('expands AI evidence body with transcript snippet + reasoning (Phase 1b shape)', () => {
		render(<EvidencePanel evidence={aiEvidencePopulated} />);
		fireEvent.click(screen.getByRole('button'));
		expect(screen.getByText(/So anyway/)).toBeTruthy();
		expect(screen.getByText(/Filler phrase drops energy/)).toBeTruthy();
		// startTime formatted as mm:ss in the label
		expect(screen.getByText(/0:12/)).toBeTruthy();
	});

	it('expands AI evidence with Phase 2 falsifier line', () => {
		const withFalsifier: BeatIssueEvidence = {
			kind: 'ai',
			startTime: 3,
			transcriptSnippet: 'Hello everyone',
			reasoning: 'Generic opener drops engagement.',
			falsifier: 'If the speaker had named a specific outcome within 2 seconds.',
		};
		render(<EvidencePanel evidence={withFalsifier} />);
		fireEvent.click(screen.getByRole('button'));
		expect(screen.getByText(/falsifierAi/)).toBeTruthy(); // i18n label key (mocked identity)
		expect(screen.getByText(/specific outcome within 2 seconds/)).toBeTruthy();
	});
});
