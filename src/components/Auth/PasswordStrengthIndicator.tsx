interface PasswordStrengthIndicatorProps {
  password: string;
}

type StrengthLevel = {
  score: 1 | 2 | 3;
  label: string;
  color: string;
};

function evaluateStrength(password: string): StrengthLevel {
  let points = 0;
  if (password.length >= 8) points += 1;
  if (password.length >= 12) points += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) points += 1;
  if (/\d/.test(password)) points += 1;
  if (/[^A-Za-z0-9]/.test(password)) points += 1;

  if (password.length < 8 || points <= 2) {
    return { score: 1, label: 'Yếu', color: '#DC3545' };
  }
  if (points <= 3) {
    return { score: 2, label: 'Trung bình', color: '#B45309' };
  }
  return { score: 3, label: 'Mạnh', color: '#15803D' };
}

export default function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  if (!password) return null;
  const { score, label, color } = evaluateStrength(password);

  return (
    <div className="mt-1 mb-1.5" aria-live="polite">
      <div className="flex items-center gap-1.5 mb-1" aria-hidden="true">
        {[1, 2, 3].map((segment) => (
          <span
            key={segment}
            className="h-1 flex-1 rounded-full transition-colors duration-200"
            style={{
              backgroundColor: segment <= score ? color : '#D7E2DF',
            }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-[12px]">
        <span style={{ color }} className="font-medium">
          Độ mạnh: {label}
        </span>
        <span className="text-[#5C6E76]">8–72 ký tự</span>
      </div>
    </div>
  );
}
