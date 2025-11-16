import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us - Coverage Gap Analyzer',
  description: 'Learn about our mission to help snowbirds, remote workers, and multi-residence families find the right health insurance coverage.',
};

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-blue-600 mb-8">About Key Insurance Matters</h1>
      <div className="prose prose-lg max-w-none">
        <p className="text-gray-700 text-lg mb-6 leading-relaxed">
          Key Insurance Matters solves a problem affecting millions: finding health insurance that covers you when you own homes in multiple states.
        </p>
        <p className="text-gray-700 text-lg mb-6 leading-relaxed">
          Traditional insurance is designed for people in one place. But snowbirds, remote workers, and families with multiple properties face a puzzle: different networks, varying rules, and expensive gaps.
        </p>
        <p className="text-gray-700 text-lg mb-6 leading-relaxed">
          Our calculator analyzes your situation—homes, household, budget—and recommends insurance that gives comprehensive coverage everywhere you live.
        </p>
        <p className="text-gray-700 text-lg leading-relaxed">
          Built by [Your Name], MBA candidate at NYU Stern with wealth management experience.
        </p>
      </div>
    </div>
  );
}
