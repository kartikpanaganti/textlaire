export function Table({ children }) {
    return <table className="w-full">{children}</table>;
  }
  
  export function TableHead({ children }) {
    return <thead className="bg-gray-700 text-white">{children}</thead>;
  }
  
  export function TableRow({ children }) {
    return <tr className="border-b border-gray-600">{children}</tr>;
  }
  
  export function TableCell({ children }) {
    return <td className="p-3 text-white">{children}</td>;
  }
  
  export function TableBody({ children }) {
    return <tbody>{children}</tbody>;
  }
  