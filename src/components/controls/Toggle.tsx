interface ToggleProps {
  on: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}

export function Toggle({ on, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => {
        onChange(!on);
      }}
      aria-pressed={on}
      aria-label={label}
      className="relative w-[34px] h-5 rounded-full p-0 cursor-pointer transition-colors duration-150"
      style={{
        border: `1px solid ${on ? '#c2410c' : '#c8c4bc'}`,
        background: on ? '#c2410c' : '#fff',
      }}
    >
      <span
        className="absolute top-px w-4 h-4 rounded-full transition-[left] duration-150"
        style={{
          left: on ? '15px' : '1px',
          background: on ? '#fff' : '#c8c4bc',
        }}
      />
    </button>
  );
}
