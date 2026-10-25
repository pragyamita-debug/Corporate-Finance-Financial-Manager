import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { findDateRange, mergedMonths } from './dates';
import { parseResume } from './parseResume';

const TODAY = new Date(2026, 9, 23); // 23 Oct 2026

describe('dates', () => {
  it('reads month-year ranges with an open end', () => {
    const r = findDateRange('Designer | Jan 2024 – Present', TODAY)!;
    expect(r.label).toBe('Jan 2024 – Present');
    expect(r.current).toBe(true);
  });

  it('reads numeric and year-only ranges', () => {
    expect(findDateRange('03/2021 - 06/2023')!.label).toBe('Mar 2021 – Jun 2023');
    expect(findDateRange('2018 to 2020')!.label).toBe('2018 – 2020');
  });

  it('counts overlapping jobs once', () => {
    const a = findDateRange('Jan 2020 - Jan 2022')!;
    const b = findDateRange('Jan 2021 - Jan 2023')!;
    expect(mergedMonths([a, b])).toBe(36);
  });
});

describe('parseResume — sample CV', () => {
  const cv = parseResume(readFileSync('src/data/sample-cv.txt', 'utf8'), TODAY);

  it('pulls the header', () => {
    expect(cv.name).toBe('Alex Morgan');
    expect(cv.headline).toBe('Financial Manager | Corporate Finance & FP&A');
    expect(cv.tagline).toMatch(/^Turning numbers into decisions/);
    expect(cv.email).toBe('alex.morgan@example.com');
    expect(cv.phone).toBe('+1 646 555 0193');
    expect(cv.location).toBe('New York, USA');
  });

  it('builds experience and stats', () => {
    expect(cv.experience).toHaveLength(3);
    expect(cv.experience[0]).toMatchObject({ role: 'Financial Manager', company: 'Example Holdings Inc.', current: true });
    expect(cv.stats.years).toBe(11);
    expect(cv.stats.yearsPlus).toBe(true);
  });

  it('keeps one-line degrees apart', () => {
    expect(cv.education).toHaveLength(2);
    expect(cv.education.map((e) => e.year)).toEqual(['2017', '2015']);
  });

  it('reads skills, projects, certifications and the rest', () => {
    expect(cv.skills).toHaveLength(12);
    expect(cv.projects).toHaveLength(6);
    expect(cv.projects[0].title).toBe('Zero-Based Budgeting Review');
    expect(cv.certifications).toHaveLength(3);
    expect(cv.achievements).toHaveLength(5);
    expect(cv.goals[0]).toEqual({ label: 'Goal', value: 'Become a Finance Director', note: 'within three years' });
    expect(cv.motto).toBe('Clarity in numbers. Confidence in decisions.');
  });
});

describe('parseResume — other layouts', () => {
  it('handles "Role at Company" and two-line headers', () => {
    const cv = parseResume(
      `Jane Doe
Senior Product Designer
jane@doe.design · +1 415 555 0101 · San Francisco
EXPERIENCE
Senior Product Designer at Figma
Mar 2021 - Present
- Led the design system
Acme Corp
UX Designer, 2017 - 2021
- Shipped mobile app
Education
Bachelor of Design (B.Des) - National Institute of Design, 2017
Skills
Design tools: Figma, Framer, Protopie
Research: Usability testing, Interviews`,
      TODAY,
    );
    expect(cv.name).toBe('Jane Doe');
    expect(cv.headline).toBe('Senior Product Designer');
    expect(cv.location).toBe('San Francisco');
    expect(cv.phone).toBe('+1 415 555 0101');
    expect(cv.experience).toHaveLength(2);
    expect(cv.experience[0]).toMatchObject({ role: 'Senior Product Designer', company: 'Figma' });
    expect(cv.experience[1]).toMatchObject({ role: 'UX Designer', company: 'Acme Corp' });
    expect(cv.stats.years).toBe(9);
    expect(cv.education[0].rank).toBe(3);
    expect(cv.skills).toEqual(['Figma', 'Framer', 'Protopie', 'Usability testing', 'Interviews']);
  });

  it('keeps un-bulleted descriptions with their role (Word CVs)', () => {
    const cv = parseResume(
      `Sam Patel
Interaction Designer
Experience
Interaction Designer at Monzo
Sep 2021 – Present
Shipped the savings pots redesign
Junior Designer — Ustwo | 2018 - 2021
Worked on wellbeing apps`,
      TODAY,
    );
    expect(cv.experience).toHaveLength(2);
    expect(cv.experience[0]).toMatchObject({ role: 'Interaction Designer', company: 'Monzo', bullets: ['Shipped the savings pots redesign'] });
    expect(cv.experience[1]).toMatchObject({ role: 'Junior Designer', company: 'Ustwo', bullets: ['Worked on wellbeing apps'] });
  });

  it('keeps one-letter skills such as R and C', () => {
    const cv = parseResume(`Pat Lee\nData Analyst\nSkills\nR, C, SQL, Python`, TODAY);
    expect(cv.skills).toEqual(['R', 'C', 'SQL', 'Python']);
  });
});
