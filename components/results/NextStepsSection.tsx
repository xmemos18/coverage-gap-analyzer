interface NextStepsSectionProps {
  actionItems: string[];
}

export default function NextStepsSection({ actionItems }: NextStepsSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span className="text-3xl">✅</span>
        Your Next Steps
      </h3>
      <div className="space-y-4">
        {actionItems.map((item, index) => (
          <div
            key={index}
            className="bg-gradient-to-r from-blue-50 to-white p-5 rounded-lg border-l-4 border-accent hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center font-bold">
                {index + 1}
              </div>
              <p className="text-gray-800 text-lg flex-1 pt-0.5">
                {item}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
