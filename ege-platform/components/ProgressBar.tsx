// Полоса прогресса. Принимает число 0–100.
// Ширина заполненной части — динамическая, поэтому задаём её через style:
// Tailwind-классы фиксированные, произвольное число процентов из них не собрать.
export default function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value)); // страхуемся от <0 и >100
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-border">
      <div
        className="h-full rounded-full bg-accent transition-all duration-500"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}