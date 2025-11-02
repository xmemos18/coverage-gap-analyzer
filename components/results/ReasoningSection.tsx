interface ReasoningSectionProps {
  reasoning: string;
}

export default function ReasoningSection({ reasoning }: ReasoningSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-3xl">💡</span>
        Why This Recommendation?
      </h3>
      <p className="text-lg text-gray-700 leading-relaxed">
        {reasoning}
      </p>
    </div>
  );
}
