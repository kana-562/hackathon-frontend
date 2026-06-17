interface Props {
  label: string;
  active?: boolean;
  onClick: () => void;
}

export default function CategoryChip({ label, active = false, onClick }: Props) {
  return (
    <button
      className={active ? 'chip active' : 'chip'}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
