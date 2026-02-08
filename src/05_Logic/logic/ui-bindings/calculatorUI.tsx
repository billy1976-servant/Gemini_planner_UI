type Props = {
    onSubmit: (result: any) => void;
  };
  
  
  export function CalculatorUI({ onSubmit }: Props) {
    return (
      <button
        onClick={() =>
          onSubmit({ total: 1234 })
        }
      >
        Submit Calculator
      </button>
    );
  }
  
  
  