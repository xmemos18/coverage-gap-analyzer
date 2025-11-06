export default function Contact() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-blue-600 mb-8">Contact Us</h1>
      <div className="bg-gray-50 rounded-lg p-8">
        <p className="text-gray-700 text-lg mb-6 leading-relaxed">
          Questions about your situation?
        </p>
        <p className="text-gray-700 text-lg">
          Email: <a href="mailto:contact@coveragegap.com" className="text-blue-600 hover:text-blue-600 underline">contact@coveragegap.com</a>
        </p>
      </div>
    </div>
  );
}
