import { TEMP_RANGE } from "@/lib/data";

export default function TemperatureLegend() {
  return (
    <div className="flex items-center gap-2 w-full md:w-auto">
      <span className="text-xs text-muted-foreground whitespace-nowrap">{TEMP_RANGE.min}°C</span>
      <div
        className="h-4 w-full md:w-48 rounded-full"
        style={{
          background: 'linear-gradient(to right, #66B2FF, #7FFFD4, #FFFF00, #FF0000)',
        }}
        aria-hidden="true"
      />
      <span className="text-xs text-muted-foreground whitespace-nowrap">{TEMP_RANGE.max}°C</span>
    </div>
  );
}
