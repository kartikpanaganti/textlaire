// src/components/Card.jsx
const Card = ({ title, value }) => (
  <div className="bg-white p-4 rounded shadow-md">
    <h3 className="font-bold">{title}</h3>
    <p>{value}</p>
  </div>
);

export default Card;
